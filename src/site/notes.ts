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
  /** Inline links: only these substrings are clickable and underlined. */
  links?: { text: string; href: string }[];
}

export type Figure =
  | { kind: 'arc'; from: string; to: string }
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
const link = (text: string, href: string) => ({ text, href });

export const notes: Note[] = [
  { id: 'date', items: [L('09/05/2026')], em: 8 },
  { id: 'name', items: [L('Anirudh Kamath', { size: 1.25 })], em: 14 },
  { id: 'flight', items: [], figure: { kind: 'arc', from: 'SF', to: 'NYC' }, em: 12 },
  {
    id: 'now',
    items: [
      L('now:'),
      SUB('- enterprise ai governance @ arcade.dev', { links: [link('arcade.dev', 'https://arcade.dev')] }),
      SUB('- cooking → @currychefwiththepot', { links: [link('@currychefwiththepot', 'https://www.instagram.com/currychefwiththepot')] }),
    ],
    em: 17,
  },
  {
    id: 'before',
    items: [
      L('before:'),
      SUB('1) Whatnot: 2nd ML hire, 2021-23', { links: [link('Whatnot', 'https://www.whatnot.com')] }),
      SUB('2) Stagehand @ Browserbase: tech lead + #1 contributor. in prod at Clay, Ramp, Lovable. 1m+ weekly npm downloads', {
        links: [link('Stagehand', 'https://github.com/browserbase/stagehand')],
      }),
      SUB('3) Smithery: co-founded. first open agent identity product, MCP identity for 300k+ people', {
        links: [link('Smithery', 'https://smithery.ai')],
      }),
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
  {
    id: 'humanity',
    items: [L('humans rock', { underline: true }), SUB('- math'), SUB('- cured a pandemic'), SUB('- machines that think')],
    brace: [1, 3],
    em: 12,
  },
  { id: 'rocket', items: [], figure: { kind: 'rocket' }, em: 6 },
  {
    id: 'ai',
    items: [L('AI should not and will not replace humans'), SUB('→ embrace our individual humanity')],
    em: 18,
  },
  { id: 'with', items: [], figure: { kind: 'boxes', a: 'AI', b: 'humans', label: 'with, not instead of' }, em: 15 },
  {
    id: 'links',
    items: [
      L('links:'),
      SUB('- twitter/x: @kamathematic', { links: [link('@kamathematic', 'https://x.com/kamathematic')] }),
      SUB('- github: kamath', { links: [link('kamath', 'https://github.com/kamath')] }),
      SUB('- linkedin: /in/kamath', { links: [link('/in/kamath', 'https://www.linkedin.com/in/kamath')] }),
    ],
    em: 13,
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
