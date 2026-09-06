// The page content, written the way the notebook is: only what's top of mind, as few words as possible.

export interface NoteItem {
  text: string;
  strike?: boolean;
  underline?: boolean;
  /** Indent in grid cells. */
  indent?: number;
  /** Blank lines after this item. */
  gap?: number;
  /** Relative font size. */
  size?: number;
  /** Makes the whole item a link. */
  href?: string;
}

export type Figure =
  | { kind: 'arc'; from: string; to: string; caption: string }
  | { kind: 'boxes'; a: string; b: string; label: string }
  | { kind: 'rocket' };

export interface Note {
  id: string;
  items: NoteItem[];
  /** Hand-drawn box around the whole block. */
  boxed?: boolean;
  /** Curly brace to the left of items [from, to]. */
  brace?: [number, number];
  figure?: Figure;
  /** Preferred text width in em. */
  em?: number;
}

const L = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, ...extra });
const X = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, strike: true, ...extra });
const SUB = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, indent: 1, ...extra });

export const notes: Note[] = [
  { id: 'date', items: [L('09/05/2026')], em: 8 },
  { id: 'name', items: [L('Anirudh Kamath', { size: 1.25 }), L('SF. often NYC.')], em: 14 },
  { id: 'flight', items: [], figure: { kind: 'arc', from: 'SF', to: 'NYC', caption: 'back and forth' }, em: 12 },
  {
    id: 'now',
    items: [
      L('now:'),
      SUB('1) agent identity @ arcade.dev', { href: 'https://arcade.dev' }),
      SUB('2) cooking → @currychefwiththepot', { href: 'https://www.instagram.com/currychefwiththepot' }),
      SUB('3)'),
    ],
    em: 16,
  },
  {
    id: 'before',
    items: [
      L('before:'),
      SUB('- Whatnot: 2nd ML hire, 2021-23', { href: 'https://www.whatnot.com' }),
      SUB('- Stagehand @ Browserbase: tech lead + #1 contributor. in prod at Clay, Ramp, Lovable. 1m+ weekly npm downloads', {
        href: 'https://github.com/browserbase/stagehand',
      }),
      SUB('- Smithery: co-founded. first open agent identity product, MCP identity for 300k+ people', { href: 'https://smithery.ai' }),
      SUB('→ acquired by arcade.dev, 07/2026', { indent: 2 }),
    ],
    em: 21,
  },
  {
    id: 'abbrev',
    items: [L('"great abbreviators" - Huxley', { href: 'https://www.goodreads.com/quotes/754134-we-are-all-as-huxley-says-someplace-great-abbreviators-meaning' })],
    boxed: true,
    em: 14,
  },
  {
    id: 'notebook',
    items: [L('this notebook: 2 pages used.'), L('if I wrote it down, it mattered.'), L('write less → rabbithole less → actually do it')],
    em: 17,
  },
  { id: 'lists', items: [L('lists are always shorter than I think'), SUB('see 3) above')], em: 15 },
  {
    id: 'humanity',
    items: [
      L('believe in humanity', { underline: true }),
      SUB('- rockets'),
      SUB('- cured a pandemic in ~1 yr'),
      SUB('- machines that emulate us'),
      SUB('→ no problem is too big'),
    ],
    brace: [1, 3],
    em: 13,
  },
  { id: 'rocket', items: [], figure: { kind: 'rocket' }, em: 6 },
  {
    id: 'ai',
    items: [L('AI is coming regardless'), SUB('→ has to serve people, not replace them'), SUB('→ I trust us enough to make that true')],
    em: 17,
  },
  { id: 'serves', items: [], figure: { kind: 'boxes', a: 'AI', b: 'people', label: 'serves' }, em: 11 },
  {
    id: 'oss',
    items: [L('open source, always', { underline: true }), SUB('- stagehand'), SUB('- smithery'), SUB('- this page + the font')],
    em: 12,
  },
  {
    id: 'hand',
    items: [
      L('irl my handwriting is neat (calligraphy too).'),
      L('this font is traced from my notebook → alternates + ligatures so it never repeats exactly'),
    ],
    em: 20,
  },
  { id: 'todo', items: [X('make a website'), L('- keep it short'), L('- ship it')], em: 10 },
];
