// The page content, written the way the notebook is: only what's top of mind, as few words as possible.

export interface NoteItem {
  text: string;
  strike?: boolean;
  underline?: boolean;
  /** Indent in grid cells (first line). */
  indent?: number;
  /** Extra indent for wrapped lines, in grid cells (hanging indent). */
  hang?: number;
  /** Blank lines after this item. */
  gap?: number;
  /** Relative font size. */
  size?: number;
  /** Makes the whole item a link. */
  href?: string;
  /** Inline links: only these substrings are clickable and underlined. */
  links?: { text: string; href: string }[];
  /** Never break this item across lines; it shrinks instead if the paper is too narrow. */
  nowrap?: boolean;
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
const SUB = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, hang: 1, ...extra });
const link = (text: string, href: string) => ({ text, href });

export const notes: Note[] = [
  { id: 'date', items: [L('09/05/2026')], em: 8 },
  { id: 'name', items: [L('Anirudh Kamath', { size: 1.25 })], em: 14 },
  { id: 'flight', items: [], figure: { kind: 'arc', from: 'SF', to: 'NYC' }, em: 12 },
  {
    id: 'now',
    items: [
      L('now:'),
      SUB('→ Enterprise agent identity @ arcade.dev', { links: [link('arcade.dev', 'https://arcade.dev')] }),
      SUB('→ cooking @currychefwiththepot', { links: [link('@currychefwiththepot', 'https://www.instagram.com/currychefwiththepot')] }),
    ],
    em: 17,
  },
  {
    id: 'before',
    items: [
      L('before:'),
      SUB('→ Smithery: co-founded. MCP identity for 300k+ humans. Acquired by arcade.dev.', { links: [link('Smithery', 'https://smithery.ai')] }),
      SUB('→ Browserbase: tech lead and co-creator of Stagehand. Used in prod at Clay, Ramp, and Lovable.', {
        links: [link('Browserbase', 'https://www.browserbase.com'), link('Stagehand', 'https://github.com/browserbase/stagehand')],
      }),
      SUB('→ Whatnot: 2nd ML hire. trained, deployed, and maintained prod recsys and experimentation engines', {
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
    id: 'humanity',
    items: [
      L('humans rock', { underline: true }),
      SUB('- the internet'),
      SUB('- cured a pandemic'),
      SUB('- machines that think', { gap: 1 }),
      L('AI should not and will not take humanity from us.', { nowrap: true }),
    ],
    brace: [1, 3],
    em: 16,
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
  { id: 'todo', items: [X('make a website'), L('- ship it')], em: 10 },
];
