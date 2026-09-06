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

export type Figure = { kind: 'arc'; from: string; to: string } | { kind: 'rocket' };

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
      SUB('1) Smithery: co-founded. MCP identity for 300k+ humans', {
        links: [link('Smithery', 'https://smithery.ai')],
      }),
      SUB('→ acquired by arcade.dev', { indent: 2 }),
      SUB('2) Stagehand @ Browserbase: tech lead + #1 contributor. in prod at Clay, Ramp, Lovable. 1m+ weekly npm downloads', {
        links: [link('Stagehand', 'https://github.com/browserbase/stagehand')],
      }),
      SUB('3) Whatnot: 2nd ML hire. trained, deployed, and maintained prod recsys and experimentation engines', {
        links: [link('Whatnot', 'https://www.whatnot.com')],
      }),
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
    items: [
      L('my handwriting is neat irl! (calligraphy too)'),
      L('this font is traced from it, with alternates and ligatures so nothing repeats exactly.'),
      L('I only used two pages in my notebook.'),
      L('write less → rabbithole less'),
    ],
    em: 19,
  },
  {
    id: 'humanity',
    items: [
      L('humans rock', { underline: true }),
      SUB('- math'),
      SUB('- cured a pandemic'),
      SUB('- machines that think', { gap: 1 }),
      L("AI won't replace us. shouldn't either."),
    ],
    brace: [1, 3],
    em: 14,
  },
  { id: 'rocket', items: [], figure: { kind: 'rocket' }, em: 6 },
  {
    id: 'links',
    items: [
      L('links:'),
      SUB('- twitter/x', { links: [link('twitter/x', 'https://x.com/kamathematic')] }),
      SUB('- github', { links: [link('github', 'https://github.com/kamath')] }),
      SUB('- linkedin', { links: [link('linkedin', 'https://www.linkedin.com/in/kamath')] }),
    ],
    em: 9,
  },
  { id: 'todo', items: [X('make a website'), L('- keep it short'), L('- ship it')], em: 10 },
];
