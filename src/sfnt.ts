// Splice extra tables into an sfnt (OTF) binary and fix up checksums.

interface TableRecord {
  tag: string;
  data: Uint8Array;
}

function readTag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function checksum(data: Uint8Array): number {
  let sum = 0;
  const padded = (data.length + 3) & ~3;
  for (let i = 0; i < padded; i += 4) {
    const b0 = data[i] ?? 0;
    const b1 = data[i + 1] ?? 0;
    const b2 = data[i + 2] ?? 0;
    const b3 = data[i + 3] ?? 0;
    sum = (sum + ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3)) >>> 0;
  }
  return sum;
}

export function readTables(buffer: ArrayBuffer): { sfntVersion: number; tables: TableRecord[] } {
  const view = new DataView(buffer);
  const sfntVersion = view.getUint32(0);
  const numTables = view.getUint16(4);
  const tables: TableRecord[] = [];
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = readTag(view, rec);
    const offset = view.getUint32(rec + 8);
    const length = view.getUint32(rec + 12);
    tables.push({ tag, data: new Uint8Array(buffer.slice(offset, offset + length)) });
  }
  return { sfntVersion, tables };
}

export function writeTables(sfntVersion: number, tables: TableRecord[]): Uint8Array {
  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const numTables = sorted.length;
  let entrySelector = 0;
  while (1 << (entrySelector + 1) <= numTables) entrySelector++;
  const searchRange = (1 << entrySelector) * 16;
  const rangeShift = numTables * 16 - searchRange;

  const headerSize = 12 + 16 * numTables;
  let total = headerSize;
  const offsets = sorted.map((t) => {
    const o = total;
    total += (t.data.length + 3) & ~3;
    return o;
  });

  // Reset head.checkSumAdjustment before computing checksums.
  const head = sorted.find((t) => t.tag === 'head');
  if (head) new DataView(head.data.buffer, head.data.byteOffset).setUint32(8, 0);

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, sfntVersion);
  view.setUint16(4, numTables);
  view.setUint16(6, searchRange);
  view.setUint16(8, entrySelector);
  view.setUint16(10, rangeShift);
  sorted.forEach((t, i) => {
    const rec = 12 + i * 16;
    for (let k = 0; k < 4; k++) view.setUint8(rec + k, t.tag.charCodeAt(k));
    view.setUint32(rec + 4, checksum(t.data));
    view.setUint32(rec + 8, offsets[i]);
    view.setUint32(rec + 12, t.data.length);
    out.set(t.data, offsets[i]);
  });

  if (head) {
    const adjust = (0xb1b0afba - checksum(out)) >>> 0;
    view.setUint32(offsets[sorted.indexOf(head)] + 8, adjust);
  }
  return out;
}

/** Return a new font binary with `extra` tables added (replacing same-tagged tables). */
export function addTables(buffer: ArrayBuffer, extra: TableRecord[]): Uint8Array {
  const { sfntVersion, tables } = readTables(buffer);
  const kept = tables.filter((t) => !extra.some((e) => e.tag === t.tag));
  return writeTables(sfntVersion, [...kept, ...extra]);
}
