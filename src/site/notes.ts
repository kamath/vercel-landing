// The page content, written the way the notebook is: only what's top of mind, as few words as possible.

export interface NoteItem {
  text: string;
  strike?: boolean;
  underline?: 'once' | 'twice';
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

export type Figure =
  | { kind: 'arc'; from: string; to: string }
  | { kind: 'rocket' }
  /** A photo stuck onto the page; its shape comes from the file itself, measured at build time. */
  | { kind: 'photo'; src: string; alt: string };

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
const SUB = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, hang: 1, ...extra });
const link = (text: string, href: string) => ({ text, href });

/** A photo from `public/imgs`. `em` sets how wide the print is, the way `em` sizes every other section. */
const PHOTO = (id: string, src: string, alt: string, em: number): Note => ({
  id,
  items: [],
  figure: { kind: 'photo', src: `imgs/${src}`, alt },
  em,
});

export const notes: Note[] = [
  { id: 'date', items: [L('09/05/2026')], em: 8 },
  { id: 'name', items: [L('Anirudh Kamath', { size: 1.25 })], em: 14 },
  { id: 'flight', items: [], figure: { kind: 'arc', from: 'SF', to: 'NYC' }, em: 12 },
  PHOTO('p-bieber', 'bieber.jpeg', 'Fireworks over the stage at a Justin Bieber concert', 9),
  {
    id: 'now',
    items: [
      L('now:', { underline: 'twice' }),
      SUB('→ enterprise identity @ arcade.dev', { links: [link('arcade.dev', 'https://arcade.dev')] }),
      SUB('→ cooking @currychefwiththepot', { links: [link('@currychefwiththepot', 'https://www.instagram.com/currychefwiththepot')] }),
    ],
    em: 17,
  },
  {
    id: 'smithery',
    items: [L('Smithery: co-founded. MCP identity for 300k+ humans. Acquired by arcade.dev.', { links: [link('Smithery', 'https://smithery.ai')] })],
    em: 16,
  },
  PHOTO('p-wall', 'great_wall.jpeg', 'The Great Wall running along the ridgeline north of Beijing', 8),
  {
    id: 'browserbase',
    items: [
      L('Browserbase: tech lead and co-creator of Stagehand. Used in prod at Clay, Ramp, and Lovable.', {
        links: [link('Browserbase', 'https://www.browserbase.com'), link('Stagehand', 'https://github.com/browserbase/stagehand')],
      }),
    ],
    em: 17,
  },
  PHOTO('p-halfdome', 'half_dome.jpeg', 'Looking down the face of Half Dome into Yosemite Valley', 8),
  {
    id: 'whatnot',
    items: [
      L('Whatnot: 2nd ML hire. trained, deployed, and maintained prod recsys and experimentation engines', {
        links: [link('Whatnot', 'https://www.whatnot.com')],
      }),
    ],
    em: 16,
  },
  PHOTO('p-shivani', 'me_and_shivani.jpeg', 'Shivani and me on the steps of Wat Arun, Bangkok', 7),
  {
    id: 'abbrev',
    items: [L('"great abbreviators"', { href: 'https://www.goodreads.com/quotes/754134-we-are-all-as-huxley-says-someplace-great-abbreviators-meaning' })],
    boxed: true,
    em: 14,
  },
  { id: 'rocket', items: [], figure: { kind: 'rocket' }, em: 6 },
  PHOTO('p-kofta', 'malai_kofta.jpeg', 'A heart-shaped malai kofta in a black bowl, sauced and topped with an edible flower', 7),
  {
    id: 'links',
    items: [
      L('links:'),
      SUB('- twitter/x', { links: [link('twitter/x', 'https://x.com/kamathematic')] }),
      SUB('- github', { links: [link('github', 'https://github.com/kamath')] }),
    ],
    em: 9,
  },
];
