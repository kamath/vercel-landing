// Specimen output: an SVG rendered through a simulation of the font's own GSUB rules,
// and an HTML page that loads the real OTF so a browser's shaper can be checked against it.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuiltGlyph } from './build.js';

const SAMPLE_LINES = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789  04/27/2025  4:14 left on this flight',
  'Make menus in minutes:',
  '1) Configure agent (ACP)  2) Configure runtime (local, Vercel, Daytona, E2B)',
  'MCP as any only works on Claude → will vertical expose MCP?',
  'generateBoard() generateMove() makeMove() gradeMove()',
  'the little coffee fell into the room, the little coffee fell',
  'minimum committee bookkeeper balloon success',
  'Sphinx of black quartz, judge my vow! "great abbreviations"',
];

/** Mirror of the GSUB logic: ligatures first, then the two-glyph-backtrack cycle. */
export function simulateShaping(text: string, built: BuiltGlyph[]): BuiltGlyph[] {
  const byName = new Map(built.map((g) => [g.name, g]));
  const byUnicode = new Map<number, BuiltGlyph>();
  for (const g of built) for (const u of g.unicodes) byUnicode.set(u, g);
  const ligs = built.filter((g) => g.components && g.variant === 0);

  let names: string[] = [...text].map((ch) => byUnicode.get(ch.codePointAt(0)!)?.name ?? '.notdef');

  // Ligature pass (longest first).
  const sortedLigs = [...ligs].sort((a, b) => b.components!.length - a.components!.length);
  const ligated: string[] = [];
  for (let i = 0; i < names.length; ) {
    const hit = sortedLigs.find((l) => l.components!.every((c, k) => names[i + k] === c));
    if (hit) {
      ligated.push(hit.name);
      i += hit.components!.length;
    } else {
      ligated.push(names[i]);
      i++;
    }
  }
  names = ligated;

  // Contextual cycle.
  const transitions = new Map<string, number>([
    ['0,0', 1], ['0,1', 2], ['1,2', 0], ['2,0', 2], ['0,2', 1], ['2,1', 0], ['1,0', 1], ['1,1', 2], ['2,2', 0],
  ]);
  const fallback = [1, 2, 0];
  const cls = (name: string | undefined): number | undefined => {
    if (!name) return undefined;
    const g = byName.get(name);
    return g && g.cycles ? g.variant : undefined;
  };
  const out: BuiltGlyph[] = [];
  for (let i = 0; i < names.length; i++) {
    let name = names[i];
    const g = byName.get(name);
    if (g && g.cycles) {
      const prev1 = cls(out[i - 1]?.name);
      const prev2 = cls(out[i - 2]?.name);
      let next = 0;
      if (prev1 !== undefined && prev2 !== undefined) next = transitions.get(`${prev2},${prev1}`)!;
      else if (prev1 !== undefined) next = fallback[prev1];
      if (next > 0) name = `${g.base}.alt${next}`;
    }
    out.push(byName.get(name) ?? byName.get('.notdef')!);
  }
  return out;
}

function pathData(g: BuiltGlyph, x: number, y: number, scale: number): string {
  const px = (p: { x: number; y: number }) => `${(x + p.x * scale).toFixed(1)} ${(y - p.y * scale).toFixed(1)}`;
  let d = '';
  for (const c of g.contours) {
    d += `M${px(c.start)}`;
    for (const s of c.segs) d += s.kind === 'line' ? `L${px(s.to)}` : `C${px(s.c1)} ${px(s.c2)} ${px(s.to)}`;
    d += 'Z';
  }
  return d;
}

export function renderSVG(built: BuiltGlyph[], lines: string[], fontSize = 44): string {
  const scale = fontSize / 1000;
  const lineHeight = fontSize * 1.55;
  const margin = 40;
  let width = 0;
  const paths: string[] = [];
  lines.forEach((line, i) => {
    const y = margin + fontSize + i * lineHeight;
    let x = margin;
    for (const g of simulateShaping(line, built)) {
      if (g.contours.length > 0) paths.push(`<path d="${pathData(g, x, y, scale)}"/>`);
      x += g.advance * scale;
    }
    width = Math.max(width, x + margin);
  });
  const height = margin * 2 + lines.length * lineHeight;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}" viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(height)}">
<rect width="100%" height="100%" fill="#f7f4ec"/>
<g fill="#1b1a1f" fill-rule="nonzero">
${paths.join('\n')}
</g>
</svg>
`;
}

export function previewHTML(fontFile: string): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = SAMPLE_LINES.map((l) => `<p>${esc(l)}</p>`).join('\n');
  return `<!doctype html>
<meta charset="utf-8">
<title>Notebook Hand preview</title>
<style>
  @font-face { font-family: "Notebook Hand"; src: url("${fontFile}") format("opentype"); }
  body { margin: 40px; background: #f7f4ec; color: #1b1a1f; font-family: "Notebook Hand", cursive; font-size: 44px; line-height: 1.55; }
  p { margin: 0; white-space: pre; }
  .off { font-feature-settings: "calt" 0, "rlig" 0, "liga" 0; }
  h2 { font: 600 13px/1 system-ui; letter-spacing: .08em; color: #8a6a4a; margin: 32px 0 8px; text-transform: uppercase; }
</style>
<h2>Real shaping (calt + liga on)</h2>
${rows}
<h2>Features off (uniform, for comparison)</h2>
<p class="off">minimum committee bookkeeper balloon success</p>
<p class="off">the little coffee fell into the room, the little coffee fell</p>
`;
}

export function writeSpecimen(built: BuiltGlyph[], dir: string): void {
  writeFileSync(join(dir, 'NotebookHand-Specimen.svg'), renderSVG(built, SAMPLE_LINES));
  writeFileSync(join(dir, 'preview.html'), previewHTML('NotebookHand-Regular.otf'));
}
