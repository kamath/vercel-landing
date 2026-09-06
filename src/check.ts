// Parse the built font back with opentype.js and report tables, features, and glyph coverage.
import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';

const file = process.argv[2] ?? 'dist/NotebookHand-Regular.otf';
const buf = readFileSync(file);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
console.log('family:', font.names.fontFamily.en, '| glyphs:', font.numGlyphs, '| tables:', Object.keys(font.tables).join(' '));
const gsub = font.tables.gsub as unknown as { features: { tag: string; feature: { lookupListIndexes: number[] } }[]; lookups: { lookupType: number; subtables: unknown[] }[] } | undefined;
if (!gsub) throw new Error('no GSUB table');
console.log('features:', gsub.features.map((f) => `${f.tag}->[${f.feature.lookupListIndexes}]`).join(' '));
console.log('lookups:', gsub.lookups.map((l, i) => `${i}:type${l.lookupType}x${l.subtables.length}`).join(' '));
const missing = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?\'"-–—_/\\()[]{}*+=<>#%&@$→'.split('').filter((ch) => font.charToGlyphIndex(ch) === 0);
console.log('unmapped characters:', missing.length ? missing.join('') : 'none');
for (const name of ['a', 'a.alt1', 'a.alt2', 't_t', 'f']) {
  let g: opentype.Glyph | undefined;
  for (let i = 0; i < font.numGlyphs; i++) if (font.glyphs.get(i).name === name) g = font.glyphs.get(i);
  console.log(`  ${name}: adv ${g?.advanceWidth} bbox`, g ? JSON.stringify(g.getBoundingBox()) : 'missing');
}
