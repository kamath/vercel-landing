// Minimal GSUB table writer: single substitution, ligature substitution, and
// chained contextual substitution (format 3), plus script/feature/lookup lists.

class Writer {
  private parts: Uint8Array[] = [];
  private size = 0;

  get length(): number {
    return this.size;
  }
  u16(v: number): this {
    if (v < 0 || v > 0xffff) throw new Error(`u16 out of range: ${v}`);
    this.parts.push(new Uint8Array([(v >> 8) & 0xff, v & 0xff]));
    this.size += 2;
    return this;
  }
  u32(v: number): this {
    this.parts.push(new Uint8Array([(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]));
    this.size += 4;
    return this;
  }
  tag(t: string): this {
    if (t.length !== 4) throw new Error(`bad tag ${t}`);
    this.parts.push(new Uint8Array([...t].map((ch) => ch.charCodeAt(0))));
    this.size += 4;
    return this;
  }
  bytes(b: Uint8Array): this {
    this.parts.push(b);
    this.size += b.length;
    return this;
  }
  toBytes(): Uint8Array {
    const out = new Uint8Array(this.size);
    let o = 0;
    for (const p of this.parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  }
}

/** Concatenate a fixed-size header (produced by `header(offsets)`) with a list of child blobs. */
function withChildren(headerSize: number, children: Uint8Array[], header: (offsets: number[]) => Writer): Uint8Array {
  const offsets: number[] = [];
  let o = headerSize;
  for (const c of children) {
    offsets.push(o);
    o += c.length;
  }
  const w = header(offsets);
  if (w.length !== headerSize) throw new Error(`header size mismatch: ${w.length} != ${headerSize}`);
  for (const c of children) w.bytes(c);
  return w.toBytes();
}

function coverage(glyphs: number[]): Uint8Array {
  const sorted = [...new Set(glyphs)].sort((a, b) => a - b);
  const w = new Writer().u16(1).u16(sorted.length);
  for (const g of sorted) w.u16(g);
  return w.toBytes();
}

/** Single substitution, format 2 (explicit substitute array). */
export function singleSubst(mapping: Map<number, number>): Uint8Array {
  const from = [...mapping.keys()].sort((a, b) => a - b);
  const cov = coverage(from);
  const headerSize = 6 + 2 * from.length;
  return withChildren(headerSize, [cov], ([covOff]) => {
    const w = new Writer().u16(2).u16(covOff).u16(from.length);
    for (const g of from) w.u16(mapping.get(g)!);
    return w;
  });
}

export interface Ligature {
  components: number[];
  ligature: number;
}

/** Ligature substitution, format 1. */
export function ligatureSubst(ligs: Ligature[]): Uint8Array {
  const byFirst = new Map<number, Ligature[]>();
  for (const l of ligs) {
    const list = byFirst.get(l.components[0]) ?? [];
    list.push(l);
    byFirst.set(l.components[0], list);
  }
  const firsts = [...byFirst.keys()].sort((a, b) => a - b);
  const sets = firsts.map((first) => {
    const list = byFirst.get(first)!.sort((a, b) => b.components.length - a.components.length);
    const ligTables = list.map((l) => {
      const w = new Writer().u16(l.ligature).u16(l.components.length);
      for (const c of l.components.slice(1)) w.u16(c);
      return w.toBytes();
    });
    return withChildren(2 + 2 * ligTables.length, ligTables, (offs) => {
      const w = new Writer().u16(ligTables.length);
      for (const o of offs) w.u16(o);
      return w;
    });
  });
  const cov = coverage(firsts);
  const headerSize = 6 + 2 * sets.length;
  return withChildren(headerSize, [...sets, cov], (offs) => {
    const covOff = offs[offs.length - 1];
    const w = new Writer().u16(1).u16(covOff).u16(sets.length);
    for (const o of offs.slice(0, sets.length)) w.u16(o);
    return w;
  });
}

export interface ChainRule {
  /** Backtrack glyph sets, closest to the input first. */
  backtrack: number[][];
  input: number[][];
  lookahead: number[][];
  records: { sequenceIndex: number; lookupIndex: number }[];
}

/** Chained contexts substitution, format 3 (coverage based). */
export function chainContextFormat3(rule: ChainRule): Uint8Array {
  const covs = [...rule.backtrack, ...rule.input, ...rule.lookahead].map(coverage);
  const headerSize =
    2 + 2 + 2 * rule.backtrack.length + 2 + 2 * rule.input.length + 2 + 2 * rule.lookahead.length + 2 + 4 * rule.records.length;
  return withChildren(headerSize, covs, (offs) => {
    const w = new Writer().u16(3);
    let i = 0;
    w.u16(rule.backtrack.length);
    for (let k = 0; k < rule.backtrack.length; k++) w.u16(offs[i++]);
    w.u16(rule.input.length);
    for (let k = 0; k < rule.input.length; k++) w.u16(offs[i++]);
    w.u16(rule.lookahead.length);
    for (let k = 0; k < rule.lookahead.length; k++) w.u16(offs[i++]);
    w.u16(rule.records.length);
    for (const r of rule.records) w.u16(r.sequenceIndex).u16(r.lookupIndex);
    return w;
  });
}

export interface Lookup {
  type: number;
  flag?: number;
  subtables: Uint8Array[];
}

function lookupTable(l: Lookup): Uint8Array {
  return withChildren(6 + 2 * l.subtables.length, l.subtables, (offs) => {
    const w = new Writer().u16(l.type).u16(l.flag ?? 0).u16(l.subtables.length);
    for (const o of offs) w.u16(o);
    return w;
  });
}

export interface Feature {
  tag: string;
  lookups: number[];
}

/** Build a complete GSUB table. Every feature is registered under DFLT and latn default language systems. */
export function buildGSUB(lookups: Lookup[], features: Feature[]): Uint8Array {
  const sortedFeatures = [...features].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

  // Lookup list
  const lookupBlobs = lookups.map(lookupTable);
  const lookupList = withChildren(2 + 2 * lookupBlobs.length, lookupBlobs, (offs) => {
    const w = new Writer().u16(lookupBlobs.length);
    for (const o of offs) w.u16(o);
    return w;
  });

  // Feature list
  const featureBlobs = sortedFeatures.map((f) => {
    const w = new Writer().u16(0).u16(f.lookups.length);
    for (const i of f.lookups) w.u16(i);
    return w.toBytes();
  });
  const featureList = withChildren(2 + 6 * featureBlobs.length, featureBlobs, (offs) => {
    const w = new Writer().u16(featureBlobs.length);
    sortedFeatures.forEach((f, i) => w.tag(f.tag).u16(offs[i]));
    return w;
  });

  // Script list: DFLT and latn, each with a default LangSys enabling every feature.
  const langSys = (() => {
    const w = new Writer().u16(0).u16(0xffff).u16(sortedFeatures.length);
    sortedFeatures.forEach((_, i) => w.u16(i));
    return w.toBytes();
  })();
  const script = withChildren(4, [langSys], ([off]) => new Writer().u16(off).u16(0));
  const scriptTags = ['DFLT', 'latn'];
  const scriptList = withChildren(2 + 6 * scriptTags.length, scriptTags.map(() => script), (offs) => {
    const w = new Writer().u16(scriptTags.length);
    scriptTags.forEach((t, i) => w.tag(t).u16(offs[i]));
    return w;
  });

  return withChildren(10, [scriptList, featureList, lookupList], ([s, f, l]) =>
    new Writer().u32(0x00010000).u16(s).u16(f).u16(l),
  );
}
