// Build NotebookHand-Regular.otf: skeleton -> variants -> outlines -> CFF font + GSUB features.

import { mkdirSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { glyphs as defs } from './glyphs.js';
import type { Contour } from './geometry.js';
import { loadClipper, strokesToOutline, translateContour } from './outline.js';
import { randomWarp, rng, warpStrokes } from './variants.js';
import { buildGSUB, chainContextFormat3, ligatureSubst, singleSubst, type Lookup } from './gsub.js';
import { addTables } from './sfnt.js';
import { writeSpecimen } from './specimen.js';

export const FAMILY = 'Notebook Hand';
export const VARIANTS = 3;
const BASE_SLANT = 0.12; // tan(~7°) rightward lean
const BASE_PEN = 54; // fine-liner nib width in font units
const LSB = 26; // tighter than the first cut; each variant then jitters its own bearings
const RSB = 26;
const BEARING_JITTER = 22;

export interface BuiltGlyph {
  name: string;
  base: string;
  variant: number;
  unicodes: number[];
  advance: number;
  contours: Contour[];
  components?: string[];
  cycles: boolean;
}

export async function buildGlyphs(): Promise<BuiltGlyph[]> {
  const clipper = await loadClipper();
  const out: BuiltGlyph[] = [];

  for (const def of defs) {
    const variantCount = def.noCycle ? 1 : VARIANTS;
    for (let v = 0; v < variantCount; v++) {
      const seed = `${def.name}#${v}`;
      const explicit = v > 0 ? def.alts?.[v - 1] : undefined;
      const strokes =
        v === 0 ? def.strokes : explicit ? warpStrokes(explicit, randomWarp(`${seed}:touch`, 0.35)) : warpStrokes(def.strokes, randomWarp(seed));

      const r = rng(`${seed}:pen`);
      const pen = BASE_PEN + (v === 0 ? 0 : (r() - 0.5) * 8);
      const slant = BASE_SLANT + (v === 0 ? 0 : (r() - 0.5) * 0.03);
      // Stochastic spacing: every variant carries its own side bearings, so the calt cycle also varies the rhythm.
      const lsbJitter = (r() - 0.5) * BEARING_JITTER;
      const rsbJitter = (r() - 0.5) * BEARING_JITTER;

      const outline = strokesToOutline(clipper, strokes, pen, slant);
      let contours = outline.contours;
      let advance: number;
      if (contours.length === 0) {
        advance = def.advance ?? 260;
      } else {
        const lsb = (def.lsb ?? LSB) + lsbJitter;
        const rsb = (def.rsb ?? RSB) + rsbJitter;
        const dx = lsb - outline.bbox.minX;
        contours = contours.map((c) => translateContour(c, dx, 0));
        advance = Math.round(outline.bbox.maxX + dx + rsb);
      }

      const unicodes = v === 0 ? (def.unicode === undefined ? [] : Array.isArray(def.unicode) ? def.unicode : [def.unicode]) : [];
      out.push({
        name: v === 0 ? def.name : `${def.name}.alt${v}`,
        base: def.name,
        variant: v,
        unicodes,
        advance,
        contours,
        components: def.components,
        cycles: !def.noCycle,
      });
    }
  }
  return out;
}

function toPath(contours: Contour[]): opentype.Path {
  const path = new opentype.Path();
  for (const c of contours) {
    path.moveTo(c.start.x, c.start.y);
    for (const seg of c.segs) {
      if (seg.kind === 'line') path.lineTo(seg.to.x, seg.to.y);
      else path.curveTo(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.to.x, seg.to.y);
    }
    path.close();
  }
  return path;
}

export function buildGSUBTable(gid: Map<string, number>, built: BuiltGlyph[]): Uint8Array {
  const cycling = built.filter((g) => g.cycles && g.variant === 0);
  const set = (v: number) => cycling.map((g) => gid.get(v === 0 ? g.name : `${g.base}.alt${v}`)!);
  const set0 = set(0);
  const set1 = set(1);
  const set2 = set(2);

  const mapping = (to: number[]) => new Map(set0.map((g, i) => [g, to[i]]));

  const ligatures = built
    .filter((g) => g.components && g.variant === 0)
    .map((g) => ({ components: g.components!.map((c) => gid.get(c)!), ligature: gid.get(g.name)! }));

  const TO_ALT1 = 1;
  const TO_ALT2 = 2;
  const TO_BASE = 3;
  const toLookup = [TO_BASE, TO_ALT1, TO_ALT2];
  const sets = [set0, set1, set2];

  // State machine on the two preceding glyphs: (prev2, prev1) -> next variant. Period 6: 0 1 2 0 2 1 ...
  const transitions: [number, number, number][] = [
    [0, 0, 1], [0, 1, 2], [1, 2, 0], [2, 0, 2], [0, 2, 1], [2, 1, 0], [1, 0, 1], [1, 1, 2], [2, 2, 0],
  ];
  const fallback: [number, number][] = [[0, 1], [1, 2], [2, 0]];

  const rules = [
    ...transitions.map(([prev2, prev1, next]) =>
      chainContextFormat3({
        backtrack: [sets[prev1], sets[prev2]],
        input: [set0],
        lookahead: [],
        records: [{ sequenceIndex: 0, lookupIndex: toLookup[next] }],
      }),
    ),
    ...fallback.map(([prev1, next]) =>
      chainContextFormat3({
        backtrack: [sets[prev1]],
        input: [set0],
        lookahead: [],
        records: [{ sequenceIndex: 0, lookupIndex: toLookup[next] }],
      }),
    ),
  ];

  const lookups: Lookup[] = [
    { type: 4, subtables: [ligatureSubst(ligatures)] }, // 0: liga
    { type: 1, subtables: [singleSubst(mapping(set1))] }, // 1: -> alt1
    { type: 1, subtables: [singleSubst(mapping(set2))] }, // 2: -> alt2
    { type: 1, subtables: [singleSubst(mapping(set0))] }, // 3: -> base (identity, keeps rule order deterministic)
    { type: 6, subtables: rules }, // 4: contextual cycle
  ];

  return buildGSUB(lookups, [
    { tag: 'liga', lookups: [0] },
    { tag: 'calt', lookups: [4] },
    { tag: 'rlig', lookups: [4] },
    { tag: 'salt', lookups: [1] },
    { tag: 'ss01', lookups: [1] },
    { tag: 'ss02', lookups: [2] },
  ]);
}

export async function buildFont(): Promise<{ bytes: Uint8Array; built: BuiltGlyph[] }> {
  const built = await buildGlyphs();

  const notdef = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: new opentype.Path() });
  const otGlyphs: opentype.Glyph[] = [notdef];
  const gid = new Map<string, number>();
  for (const g of built) {
    gid.set(g.name, otGlyphs.length);
    const glyph = new opentype.Glyph({
      name: g.name,
      advanceWidth: g.advance,
      path: toPath(g.contours),
      ...(g.unicodes.length > 0 ? { unicode: g.unicodes[0], unicodes: g.unicodes } : {}),
    });
    otGlyphs.push(glyph);
  }

  const font = new opentype.Font({
    familyName: FAMILY,
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 920,
    descender: -280,
    designer: 'Anirudh Kamath',
    description: 'Handwriting font traced from a notebook, with contextual alternates and ligatures.',
    glyphs: otGlyphs,
  });

  const base = font.toArrayBuffer();
  const gsub = buildGSUBTable(gid, built);
  const bytes = addTables(base, [{ tag: 'GSUB', data: gsub }]);
  return { bytes, built };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!);
if (isMain) {
  const { bytes, built } = await buildFont();
  mkdirSync('dist', { recursive: true });
  const otf = 'dist/NotebookHand-Regular.otf';
  writeFileSync(otf, bytes);
  writeSpecimen(built, 'dist');
  const segs = built.reduce((n, g) => n + g.contours.reduce((m, c) => m + c.segs.length, 0), 0);
  console.log(`wrote ${otf} (${(bytes.length / 1024).toFixed(1)} KB, ${built.length + 1} glyphs, ${segs} path segments)`);
}
