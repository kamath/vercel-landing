// Stroke skeletons for every glyph, traced from the notebook handwriting.
// Coordinates are in font units (UPM 1000) in an upright frame; the slant is applied later.
//   baseline 0, x-height 400, ascender 700, cap height 670, descender -220.

import { C, O, P, S, s, type Stroke } from './geometry.js';

export interface GlyphDef {
  name: string;
  unicode?: number | number[];
  strokes: Stroke[];
  /** Explicit alternate skeletons (variant 1, variant 2). Missing ones are derived by warping. */
  alts?: Stroke[][];
  lsb?: number;
  rsb?: number;
  /** Fixed advance width (used for space-like glyphs). */
  advance?: number;
  /** Ligature: component glyph names in order. */
  components?: string[];
  /** Exclude from the contextual-alternate cycle (dots, punctuation that should stay uniform). */
  noCycle?: boolean;
}

const XH = 400;
const ASC = 700;
const CAP = 670;
const DESC = -220;

// A short tick used as an i/j dot: a fine-liner dot is really a tiny dash.
const dot = (x: number, y: number): Stroke => s(x, y, x + 12, y + 14);

export const glyphs: GlyphDef[] = [
  // ---------------------------------------------------------------- lowercase
  {
    name: 'a',
    unicode: 0x61,
    strokes: [
      s(300, 330, 205, 400, 95, 372, 45, 240, 72, 90, 172, 22, 272, 58, 302, 165),
      s(302, 395, 305, 200, 312, 32, 358, 6),
    ],
    alts: [
      [
        s(292, 340, 195, 402, 80, 360, 40, 220, 80, 70, 185, 25, 280, 75, 300, 180),
        s(300, 405, 306, 190, 306, 20),
      ],
      [
        s(305, 320, 215, 395, 100, 380, 48, 250, 65, 100, 160, 28, 265, 55, 300, 150),
        s(300, 380, 308, 210, 318, 40, 372, 12),
      ],
    ],
  },
  {
    name: 'b',
    unicode: 0x62,
    strokes: [s(60, ASC, 55, 350, 58, 20), s(58, 290, 140, 392, 265, 380, 330, 260, 305, 92, 185, 15, 62, 32)],
    alts: [
      [s(65, ASC + 10, 58, 350, 55, 25), s(55, 300, 150, 398, 270, 372, 325, 245, 300, 80, 180, 12, 58, 40)],
    ],
  },
  {
    name: 'c',
    unicode: 0x63,
    strokes: [s(300, 330, 240, 398, 120, 395, 45, 300, 40, 120, 122, 20, 240, 26, 305, 82)],
    alts: [[s(292, 345, 225, 400, 110, 385, 42, 280, 48, 110, 130, 18, 245, 30, 300, 95)]],
  },
  {
    name: 'd',
    unicode: 0x64,
    strokes: [
      s(312, 300, 240, 395, 110, 388, 45, 280, 55, 110, 150, 20, 270, 42, 322, 120),
      s(325, ASC, 322, 350, 330, 20, 368, 5),
    ],
    alts: [
      [
        s(305, 320, 230, 398, 105, 380, 40, 265, 60, 95, 160, 22, 275, 50, 318, 135),
        s(330, ASC + 8, 322, 360, 326, 22),
      ],
    ],
  },
  {
    name: 'e',
    unicode: 0x65,
    strokes: [s(60, 215, 180, 222, 300, 228, 315, 300, 250, 395, 130, 395, 50, 290, 50, 150, 140, 30, 250, 25, 330, 70)],
    alts: [
      [s(55, 205, 190, 215, 305, 215, 310, 300, 240, 392, 120, 388, 45, 280, 50, 140, 145, 28, 260, 30, 325, 85)],
      [s(65, 225, 200, 230, 292, 240, 300, 320, 235, 398, 125, 395, 48, 300, 42, 160, 135, 32, 255, 22, 335, 60)],
    ],
  },
  {
    name: 'f',
    unicode: 0x66,
    lsb: 25,
    rsb: -35,
    strokes: [s(100, 15, 95, 300, 108, 560, 168, 690, 258, ASC, 300, 655), s(20, XH + 20, 245, XH + 20)],
    alts: [[s(105, 20, 92, 280, 100, 540, 160, 680, 250, ASC + 5, 305, 660), s(15, XH + 10, 260, XH + 30)]],
  },
  {
    name: 'g',
    unicode: 0x67,
    strokes: [
      s(300, 330, 220, 395, 110, 385, 45, 270, 60, 110, 150, 30, 260, 45, 305, 130),
      s(305, 395, 310, 200, 300, -30, 250, -190, 150, DESC, 60, -160),
    ],
    alts: [
      [
        s(295, 340, 210, 400, 100, 380, 42, 260, 62, 100, 160, 25, 265, 55, 300, 150),
        s(300, 400, 306, 180, 290, -60, 220, -200, 120, DESC - 5, 50, -170),
      ],
      [
        s(305, 320, 225, 392, 115, 388, 48, 280, 58, 120, 155, 32, 262, 42, 308, 120),
        s(308, 395, 315, 180, 305, -20, 270, -170, 170, -225, 90, -190),
      ],
    ],
  },
  {
    name: 'h',
    unicode: 0x68,
    strokes: [s(60, ASC, 55, 350, 60, 20), s(60, 280, 130, 385, 240, 395, 310, 320, 315, 200, 318, 20)],
    alts: [[s(65, ASC + 10, 58, 340, 55, 25), s(58, 260, 135, 380, 245, 398, 315, 330, 312, 180, 322, 20)]],
  },
  {
    name: 'i',
    unicode: 0x69,
    strokes: [s(60, XH, 55, 200, 65, 20), dot(56, 540)],
    alts: [[s(62, XH + 5, 58, 200, 60, 20), dot(60, 560)], [s(58, XH - 5, 55, 220, 68, 25, 100, 8), dot(52, 545)]],
  },
  {
    name: 'j',
    unicode: 0x6a,
    strokes: [s(140, XH, 140, 150, 135, -60, 90, -190, 0, -200), dot(136, 540)],
    lsb: 20,
  },
  {
    name: 'k',
    unicode: 0x6b,
    strokes: [s(60, ASC, 55, 350, 60, 20), s(280, 395, 165, 270, 65, 200), s(140, 240, 240, 120, 310, 15)],
    alts: [[s(65, ASC + 8, 58, 340, 55, 25), s(270, 385, 160, 260, 62, 190), s(120, 225, 235, 130, 320, 20)]],
  },
  {
    name: 'l',
    unicode: 0x6c,
    strokes: [s(60, ASC, 55, 400, 60, 20)],
    alts: [[s(65, ASC + 8, 58, 380, 62, 30, 100, 8)], [s(58, ASC - 5, 55, 400, 58, 22)]],
  },
  {
    name: 'm',
    unicode: 0x6d,
    strokes: [
      s(60, XH, 55, 200, 60, 20),
      s(60, 270, 120, 380, 210, 395, 270, 320, 275, 200, 278, 20),
      s(278, 280, 335, 385, 425, 395, 490, 320, 495, 200, 500, 20),
    ],
    alts: [
      [
        s(62, XH + 5, 58, 200, 58, 25),
        s(58, 260, 125, 385, 215, 398, 268, 330, 272, 190, 275, 20),
        s(275, 270, 340, 390, 430, 392, 488, 310, 492, 190, 505, 25),
      ],
    ],
  },
  {
    name: 'n',
    unicode: 0x6e,
    strokes: [s(60, XH, 55, 200, 60, 20), s(60, 270, 120, 380, 220, 395, 300, 320, 305, 200, 310, 20)],
    alts: [
      [s(62, XH + 5, 58, 200, 58, 25), s(58, 255, 130, 385, 225, 398, 298, 330, 302, 190, 312, 20)],
      [s(58, XH - 5, 55, 210, 62, 20), s(60, 285, 115, 375, 215, 392, 305, 310, 310, 180, 305, 22)],
    ],
  },
  {
    name: 'o',
    unicode: 0x6f,
    strokes: [O(P(165, 400), P(65, 310), P(45, 175), P(110, 40), P(230, 25), P(310, 110), P(315, 260), P(250, 385))],
    alts: [
      [O(P(170, 402), P(70, 320), P(40, 180), P(105, 35), P(235, 28), P(318, 120), P(310, 270), P(245, 380))],
      [O(P(160, 398), P(62, 300), P(48, 170), P(115, 45), P(225, 22), P(305, 100), P(320, 250), P(255, 388))],
    ],
  },
  {
    name: 'p',
    unicode: 0x70,
    strokes: [s(60, XH, 58, 100, 55, DESC), s(60, 300, 150, 395, 270, 380, 330, 260, 300, 90, 180, 15, 60, 40)],
    alts: [[s(62, XH + 5, 60, 90, 52, DESC - 5), s(58, 290, 145, 398, 275, 375, 325, 250, 305, 85, 185, 20, 60, 45)]],
  },
  {
    name: 'q',
    unicode: 0x71,
    strokes: [
      s(300, 300, 230, 395, 110, 390, 45, 280, 55, 110, 150, 20, 270, 40, 315, 120),
      s(315, 395, 312, 100, 315, DESC, 360, -200),
    ],
  },
  {
    name: 'r',
    unicode: 0x72,
    strokes: [s(60, XH, 55, 200, 60, 20), s(60, 260, 120, 370, 200, 395, 260, 360)],
    alts: [
      [s(62, XH + 5, 58, 200, 58, 25), s(58, 250, 125, 375, 210, 398, 270, 350)],
      [s(58, XH - 5, 55, 210, 62, 20), s(60, 275, 115, 365, 195, 392, 250, 372)],
    ],
    rsb: 30,
  },
  {
    name: 's',
    unicode: 0x73,
    strokes: [s(270, 350, 200, 400, 110, 395, 60, 330, 90, 250, 200, 190, 260, 120, 220, 40, 110, 15, 40, 60)],
    alts: [
      [s(265, 360, 190, 402, 105, 390, 55, 320, 95, 240, 205, 180, 265, 110, 215, 35, 105, 18, 35, 70)],
      [s(275, 340, 210, 398, 115, 398, 65, 340, 88, 260, 195, 200, 255, 130, 225, 45, 115, 12, 45, 55)],
    ],
  },
  {
    name: 't',
    unicode: 0x74,
    strokes: [s(120, 620, 112, 300, 120, 50, 170, 10, 230, 30), s(30, XH, 250, XH)],
    alts: [
      [s(125, 600, 115, 300, 118, 20), s(25, XH + 5, 255, XH - 5)],
      [s(118, 630, 110, 300, 122, 45, 180, 8, 240, 35), s(35, XH - 5, 260, XH + 5)],
    ],
  },
  {
    name: 'u',
    unicode: 0x75,
    strokes: [s(60, XH, 55, 200, 90, 50, 180, 20, 260, 70, 300, 200), s(300, XH, 300, 200, 310, 20)],
    alts: [
      [s(62, XH + 5, 58, 190, 95, 45, 185, 18, 265, 80, 302, 210), s(302, XH + 5, 300, 200, 312, 22, 340, 5)],
      [s(58, XH - 5, 52, 210, 85, 55, 175, 22, 255, 65, 298, 190), s(298, XH - 5, 300, 210, 308, 20)],
    ],
  },
  {
    name: 'v',
    unicode: 0x76,
    strokes: [s(40, XH, 110, 220, 160, 25, 210, 220, 290, XH)],
    alts: [[S(P(45, XH), C(165, 20), P(295, XH + 5))]],
  },
  {
    name: 'w',
    unicode: 0x77,
    strokes: [S(P(30, XH), C(110, 25), C(195, 300), C(275, 25), P(355, XH))],
    alts: [[S(P(35, XH + 5), P(80, 200), C(115, 25), P(160, 200), C(200, 320), P(240, 200), C(280, 30), P(320, 220), P(360, XH))]],
  },
  {
    name: 'x',
    unicode: 0x78,
    strokes: [s(40, XH, 300, 20), s(300, XH, 40, 20)],
    alts: [[s(35, XH + 5, 305, 15), s(295, XH, 45, 25)]],
  },
  {
    name: 'y',
    unicode: 0x79,
    strokes: [s(40, XH, 100, 220, 170, 40), s(300, XH, 220, 150, 130, -80, 40, DESC)],
    alts: [
      [s(45, XH + 5, 105, 210, 175, 30), s(305, XH, 230, 140, 120, -100, 20, DESC - 10)],
      [s(40, XH - 5, 95, 220, 165, 45), s(295, XH + 5, 215, 150, 150, -60, 90, -190, 30, -215)],
    ],
  },
  {
    name: 'z',
    unicode: 0x7a,
    strokes: [S(P(40, XH), C(280, XH), C(40, 20), P(300, 20))],
    alts: [[S(P(45, XH + 5), C(285, XH - 5), C(35, 15), P(310, 25))]],
  },

  // ---------------------------------------------------------------- uppercase
  { name: 'A', unicode: 0x41, strokes: [S(P(30, 0), C(170, CAP), P(310, 0)), s(85, 220, 255, 220)] },
  {
    name: 'B',
    unicode: 0x42,
    strokes: [
      s(60, CAP, 55, 0),
      s(60, CAP, 230, CAP + 10, 300, 590, 280, 460, 180, 370, 60, 370),
      s(60, 370, 220, 380, 320, 290, 320, 120, 230, 10, 60, 10),
    ],
  },
  { name: 'C', unicode: 0x43, strokes: [s(330, 560, 270, 660, 150, CAP, 50, 560, 30, 340, 50, 120, 150, 10, 270, 20, 335, 110)] },
  { name: 'D', unicode: 0x44, strokes: [s(60, CAP, 55, 0), s(60, CAP, 200, CAP + 10, 310, 610, 350, 340, 310, 80, 200, 0, 60, 0)] },
  { name: 'E', unicode: 0x45, strokes: [s(60, CAP, 55, 0), s(60, CAP, 300, CAP), s(60, 350, 240, 350), s(55, 0, 310, 0)] },
  { name: 'F', unicode: 0x46, strokes: [s(60, CAP, 55, 0), s(60, CAP, 300, CAP), s(60, 350, 230, 350)] },
  {
    name: 'G',
    unicode: 0x47,
    strokes: [s(330, 560, 270, 660, 150, CAP, 50, 560, 30, 340, 50, 120, 150, 10, 270, 20, 335, 110, 340, 300), s(200, 300, 345, 300)],
  },
  { name: 'H', unicode: 0x48, strokes: [s(60, CAP, 55, 0), s(330, CAP, 330, 0), s(60, 340, 330, 340)] },
  { name: 'I', unicode: 0x49, strokes: [s(60, CAP, 55, 0)], alts: [[s(60, CAP, 55, 0), s(10, CAP, 110, CAP), s(5, 0, 105, 0)]] },
  { name: 'J', unicode: 0x4a, strokes: [s(200, CAP, 200, 300, 190, 60, 120, 0, 40, 30, 20, 120)] },
  { name: 'K', unicode: 0x4b, strokes: [s(60, CAP, 55, 0), s(300, CAP, 60, 300), s(140, 380, 320, 0)] },
  { name: 'L', unicode: 0x4c, strokes: [S(P(60, CAP), C(55, 0), P(300, 0))] },
  { name: 'M', unicode: 0x4d, strokes: [S(P(40, 0), C(60, CAP), C(200, 220), C(340, CAP), P(360, 0))] },
  { name: 'N', unicode: 0x4e, strokes: [S(P(40, 0), C(55, CAP), C(330, 0), P(340, CAP))] },
  {
    name: 'O',
    unicode: 0x4f,
    strokes: [O(P(190, CAP + 10), P(60, 560), P(30, 340), P(60, 110), P(190, -5), P(320, 110), P(350, 340), P(320, 560))],
  },
  { name: 'P', unicode: 0x50, strokes: [s(60, CAP, 55, 0), s(60, CAP, 230, CAP + 10, 310, 600, 300, 460, 210, 360, 60, 360)] },
  {
    name: 'Q',
    unicode: 0x51,
    strokes: [O(P(190, CAP + 10), P(60, 560), P(30, 340), P(60, 110), P(190, -5), P(320, 110), P(350, 340), P(320, 560)), s(230, 120, 360, -40)],
  },
  { name: 'R', unicode: 0x52, strokes: [s(60, CAP, 55, 0), s(60, CAP, 230, CAP + 10, 310, 600, 300, 460, 210, 360, 60, 360), s(180, 360, 330, 0)] },
  {
    name: 'S',
    unicode: 0x53,
    strokes: [s(320, 560, 250, CAP, 120, CAP, 40, 580, 60, 450, 180, 380, 300, 300, 320, 150, 240, 20, 110, 10, 30, 90)],
  },
  { name: 'T', unicode: 0x54, strokes: [s(20, CAP, 340, CAP), s(180, CAP, 180, 0)] },
  { name: 'U', unicode: 0x55, strokes: [s(50, CAP, 45, 250, 90, 50, 190, 10, 290, 50, 340, 250, 340, CAP)] },
  { name: 'V', unicode: 0x56, strokes: [S(P(30, CAP), C(180, 0), P(340, CAP))] },
  { name: 'W', unicode: 0x57, strokes: [S(P(20, CAP), C(110, 0), C(210, 500), C(310, 0), P(400, CAP))] },
  { name: 'X', unicode: 0x58, strokes: [s(40, CAP, 330, 0), s(330, CAP, 40, 0)] },
  { name: 'Y', unicode: 0x59, strokes: [S(P(40, CAP), C(180, 330), P(330, CAP)), s(180, 330, 180, 0)] },
  { name: 'Z', unicode: 0x5a, strokes: [S(P(40, CAP), C(320, CAP), C(40, 0), P(330, 0))] },

  // ---------------------------------------------------------------- digits
  {
    name: 'zero',
    unicode: 0x30,
    strokes: [O(P(150, 650), P(50, 500), P(40, 320), P(60, 120), P(150, -5), P(240, 60), P(270, 320), P(240, 540))],
  },
  { name: 'one', unicode: 0x31, strokes: [S(P(60, 520), C(140, 650), P(140, 0))] },
  { name: 'two', unicode: 0x32, strokes: [S(P(50, 540), P(120, 640), P(220, 640), P(280, 540), P(240, 400), P(120, 220), C(40, 10), P(300, 10))] },
  {
    name: 'three',
    unicode: 0x33,
    strokes: [S(P(50, 600), P(150, 650), P(250, 600), P(250, 450), C(150, 370), P(260, 300), P(280, 130), P(180, 10), P(60, 40))],
  },
  { name: 'four', unicode: 0x34, strokes: [S(P(230, 650), C(60, 220), P(300, 220)), s(240, 400, 240, 0)] },
  {
    name: 'five',
    unicode: 0x35,
    strokes: [S(P(280, 650), C(80, 650), C(60, 380), P(160, 410), P(270, 340), P(280, 150), P(190, 10), P(60, 50))],
  },
  { name: 'six', unicode: 0x36, strokes: [s(260, 640, 140, 600, 60, 420, 40, 180, 110, 20, 230, 30, 280, 160, 220, 300, 90, 290)] },
  { name: 'seven', unicode: 0x37, strokes: [S(P(40, 650), C(300, 650), P(120, 0))] },
  {
    name: 'eight',
    unicode: 0x38,
    strokes: [
      O(
        P(150, 650), P(60, 560), P(80, 430), P(160, 340), P(60, 220), P(40, 80), P(150, 0),
        P(260, 80), P(240, 220), P(160, 340), P(240, 430), P(240, 560),
      ),
    ],
  },
  { name: 'nine', unicode: 0x39, strokes: [s(260, 450, 180, 560, 70, 530, 40, 400, 110, 300, 230, 330, 270, 450, 240, 180, 150, 0)] },

  // ---------------------------------------------------------------- punctuation
  { name: 'space', unicode: 0x20, strokes: [], advance: 260 },
  { name: 'period', unicode: 0x2e, strokes: [s(60, 20, 70, 32)], noCycle: true },
  { name: 'comma', unicode: 0x2c, strokes: [s(70, 40, 60, -20, 20, -80)], noCycle: true },
  { name: 'colon', unicode: 0x3a, strokes: [s(60, 300, 70, 312), s(60, 20, 70, 32)], noCycle: true },
  { name: 'semicolon', unicode: 0x3b, strokes: [s(60, 300, 70, 312), s(70, 40, 60, -20, 20, -80)], noCycle: true },
  { name: 'exclam', unicode: 0x21, strokes: [s(60, CAP, 55, 150), s(55, 20, 65, 32)], noCycle: true },
  {
    name: 'question',
    unicode: 0x3f,
    strokes: [s(40, 560, 120, CAP, 240, CAP, 290, 560, 230, 420, 160, 320, 160, 220), s(160, 20, 170, 32)],
  },
  { name: 'quotesingle', unicode: 0x27, strokes: [s(60, CAP, 50, 520)], noCycle: true },
  { name: 'quotedbl', unicode: 0x22, strokes: [s(60, CAP, 50, 520), s(160, CAP, 150, 520)], noCycle: true },
  { name: 'quoteleft', unicode: 0x2018, strokes: [s(70, CAP, 40, 590, 60, 530)], noCycle: true },
  { name: 'quoteright', unicode: 0x2019, strokes: [s(50, CAP, 70, 610, 40, 530)], noCycle: true },
  { name: 'quotedblleft', unicode: 0x201c, strokes: [s(70, CAP, 40, 590, 60, 530), s(170, CAP, 140, 590, 160, 530)], noCycle: true },
  { name: 'quotedblright', unicode: 0x201d, strokes: [s(50, CAP, 70, 610, 40, 530), s(150, CAP, 170, 610, 140, 530)], noCycle: true },
  { name: 'hyphen', unicode: [0x2d, 0xad], strokes: [s(30, 230, 230, 220)], noCycle: true },
  { name: 'endash', unicode: 0x2013, strokes: [s(30, 230, 380, 222)], noCycle: true },
  { name: 'emdash', unicode: 0x2014, strokes: [s(30, 232, 620, 220)], noCycle: true },
  { name: 'underscore', unicode: 0x5f, strokes: [s(0, -80, 450, -85)], noCycle: true },
  { name: 'slash', unicode: 0x2f, strokes: [s(40, -40, 300, ASC)], noCycle: true },
  { name: 'backslash', unicode: 0x5c, strokes: [s(40, ASC, 300, -40)], noCycle: true },
  { name: 'parenleft', unicode: 0x28, strokes: [s(180, ASC + 20, 70, 500, 40, 250, 70, 0, 180, -200)] },
  { name: 'parenright', unicode: 0x29, strokes: [s(40, ASC + 20, 150, 500, 180, 250, 150, 0, 40, -200)] },
  { name: 'bracketleft', unicode: 0x5b, strokes: [S(P(180, ASC + 20), C(70, ASC + 20), C(70, -200), P(180, -200))], noCycle: true },
  { name: 'bracketright', unicode: 0x5d, strokes: [S(P(40, ASC + 20), C(150, ASC + 20), C(150, -200), P(40, -200))], noCycle: true },
  {
    name: 'braceleft',
    unicode: 0x7b,
    strokes: [S(P(200, ASC + 20), P(120, 690), P(110, 400), C(40, 250), P(110, 100), P(120, -190), P(200, -200))],
    noCycle: true,
  },
  {
    name: 'braceright',
    unicode: 0x7d,
    strokes: [S(P(40, ASC + 20), P(120, 690), P(130, 400), C(200, 250), P(130, 100), P(120, -190), P(40, -200))],
    noCycle: true,
  },
  { name: 'asterisk', unicode: 0x2a, strokes: [s(130, CAP, 130, 400), s(20, 600, 240, 470), s(240, 600, 20, 470)], noCycle: true },
  { name: 'plus', unicode: 0x2b, strokes: [s(150, 420, 150, 60), s(20, 240, 280, 240)], noCycle: true },
  { name: 'minus', unicode: 0x2212, strokes: [s(20, 240, 280, 240)], noCycle: true },
  { name: 'equal', unicode: 0x3d, strokes: [s(20, 300, 280, 300), s(20, 170, 280, 170)], noCycle: true },
  { name: 'less', unicode: 0x3c, strokes: [S(P(280, 420), C(30, 240), P(280, 60))], noCycle: true },
  { name: 'greater', unicode: 0x3e, strokes: [S(P(20, 420), C(270, 240), P(20, 60))], noCycle: true },
  { name: 'numbersign', unicode: 0x23, strokes: [s(120, 620, 60, 20), s(280, 620, 220, 20), s(20, 420, 320, 420), s(0, 200, 300, 200)], noCycle: true },
  {
    name: 'percent',
    unicode: 0x25,
    strokes: [O(P(90, 640), P(30, 560), P(50, 470), P(120, 460), P(160, 540), P(140, 630)), s(320, 650, 40, 0), O(P(280, 180), P(220, 110), P(240, 20), P(310, 10), P(350, 90), P(330, 170))],
    noCycle: true,
  },
  {
    name: 'ampersand',
    unicode: 0x26,
    strokes: [s(330, 120, 200, 20, 80, 50, 40, 170, 130, 300, 240, 460, 250, 600, 180, CAP, 100, 600, 110, 470, 200, 300, 300, 150, 370, 40)],
  },
  {
    name: 'at',
    unicode: 0x40,
    strokes: [
      s(330, 250, 280, 110, 160, 80, 90, 200, 120, 340, 260, 340, 320, 240, 330, 100, 430, 180, 430, 350, 330, 470, 180, 480, 60, 380, 30, 200, 90, 40, 220, -10, 370, 20),
    ],
    noCycle: true,
  },
  { name: 'dollar', unicode: 0x24, strokes: [s(320, 560, 250, CAP, 120, CAP, 40, 580, 60, 450, 180, 380, 300, 300, 320, 150, 240, 20, 110, 10, 30, 90), s(180, 730, 175, -60)] },
  { name: 'arrowright', unicode: 0x2192, strokes: [s(30, 240, 400, 236), S(P(320, 340), C(410, 236), P(320, 130))], noCycle: true },
  { name: 'bullet', unicode: 0x2022, strokes: [O(P(100, 280), P(60, 240), P(100, 200), P(140, 240))], noCycle: true },
  { name: 'checkmark', unicode: 0x2713, strokes: [S(P(30, 300), C(150, 40), P(380, 620))], noCycle: true },

  // ---------------------------------------------------------------- ligatures
  {
    name: 't_t',
    components: ['t', 't'],
    strokes: [s(120, 620, 112, 300, 120, 50, 170, 10, 230, 30), s(360, 640, 352, 300, 360, 50, 410, 10, 470, 30), s(30, XH + 5, 500, XH - 5)],
    alts: [[s(125, 600, 115, 300, 118, 20), s(365, 630, 355, 300, 362, 45, 420, 8, 480, 35), s(25, XH - 5, 510, XH + 8)]],
  },
  {
    name: 't_h',
    components: ['t', 'h'],
    strokes: [
      s(120, 620, 112, 300, 120, 50, 170, 10, 230, 30),
      s(30, XH + 5, 340, XH - 5),
      s(330, ASC, 325, 350, 330, 20),
      s(330, 280, 400, 385, 510, 395, 580, 320, 585, 200, 588, 20),
    ],
    alts: [
      [
        s(125, 600, 115, 300, 118, 20),
        s(25, XH - 5, 345, XH + 5),
        s(335, ASC + 8, 328, 340, 325, 25),
        s(328, 260, 405, 380, 515, 398, 585, 330, 582, 180, 592, 20),
      ],
    ],
  },
  {
    name: 'f_f',
    components: ['f', 'f'],
    lsb: 25,
    rsb: -35,
    strokes: [s(100, 15, 95, 300, 108, 560, 168, 690, 258, ASC, 300, 655), s(340, 15, 335, 300, 348, 560, 408, 690, 498, ASC, 540, 655), s(20, XH + 25, 490, XH + 15)],
  },
  {
    name: 'l_l',
    components: ['l', 'l'],
    strokes: [s(60, ASC, 55, 400, 60, 20), s(230, ASC + 15, 225, 380, 235, 25, 275, 5)],
    alts: [[s(65, ASC + 10, 58, 380, 62, 25), s(228, ASC - 10, 225, 400, 230, 22)]],
  },
  {
    name: 'f_i',
    components: ['f', 'i'],
    lsb: 25,
    strokes: [s(100, 15, 95, 300, 108, 560, 168, 690, 258, ASC, 300, 655), s(20, XH + 20, 330, XH + 12), s(320, XH, 315, 200, 325, 20), dot(316, 540)],
  },
];

export const metrics = { XH, ASC, CAP, DESC };
