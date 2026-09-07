// Small pen doodles, each three grid rows tall and centred in its block: the rocket, the pointed ribbon "S", a
// wireframe cube, and an 8 written over itself a few times without lifting the pen. Every doodle is drawn by a
// slightly different hand: the seed picks its tilt, size, pen, how unsteady the line is, and the proportions of the
// shape, so two doodles of the same kind never come out the same.
import { rng } from '../variants.js';
import { ink, svgEl, wobbly, type XY } from './doodle.js';

export const SKETCHES = ['rocket', 'ess', 'cube', 'eight'] as const;
export type Sketch = (typeof SKETCHES)[number];

const ROWS = 3;

/** Width each doodle needs relative to its height; the block is at least this wide. */
const ASPECT: Record<Sketch, number> = { rocket: 0.75, ess: 0.7, cube: 0.95, eight: 0.6 };

export function sketchSize(kind: Sketch, w: number, grid: number): { w: number; h: number } {
  const h = grid * ROWS;
  return { w: Math.max(w, h * ASPECT[kind]), h };
}

/** What one doodle's hand is like today. */
interface Hand {
  r: () => number;
  seed: string;
  /** Multiplies the wobble of every stroke. */
  shake: number;
  /** Stroke width. */
  pen: number;
}

const between = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo);

export function drawSketch(svg: SVGSVGElement, kind: Sketch, w: number, grid: number, seed: string): { w: number; h: number } {
  const size = sketchSize(kind, w, grid);
  const r = rng(`${seed}:hand`);
  const hand: Hand = { r, seed, shake: between(r, 0.7, 1.4), pen: between(r, 1.8, 2.4) };
  // Drawn a little smaller than the block, at a slight tilt, and not quite centred.
  const scale = between(r, 0.84, 1);
  const h = size.h * scale;
  const cx = size.w / 2 + (r() - 0.5) * size.h * 0.06;
  const cy = size.h / 2 + (r() - 0.5) * size.h * 0.04;
  const tilt = (r() - 0.5) * 9;
  const g = svgEl('g', { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${tilt.toFixed(1)}) translate(0 ${(-h / 2).toFixed(1)})` });
  svg.append(g);
  if (kind === 'rocket') rocket(g, h, hand);
  else if (kind === 'ess') ess(g, h, hand);
  else if (kind === 'cube') cube(g, h, hand);
  else eight(g, h, hand);
  return size;
}

/** One stroke of the pen through `pts` (in a frame whose x axis is centred on 0). */
function stroke(g: SVGGElement, pts: XY[], hand: Hand, tag: string, amp: number, step: number, pen = hand.pen): void {
  g.append(ink(wobbly(pts, `${hand.seed}:${tag}`, amp * hand.shake, step), pen));
}

/**
 * Softens the corners of a polyline the way a moving pen does: each interior vertex gets a shoulder point on either
 * side, `radius` away along the edges, and is itself pulled a little toward the chord between them, so the smoothing
 * in `wobbly` turns the corner instead of stopping dead on it. The corner stays a corner, just not a needle.
 */
function rounded(pts: XY[], radius: number, soft = 0.25): XY[] {
  const out: XY[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const v = pts[i];
    const shoulder = (n: XY): XY => {
      const len = Math.hypot(n.x - v.x, n.y - v.y);
      const t = Math.min(0.45, radius / (len || 1));
      return { x: v.x + (n.x - v.x) * t, y: v.y + (n.y - v.y) * t };
    };
    const a = shoulder(pts[i - 1]);
    const b = shoulder(pts[i + 1]);
    out.push(a, { x: v.x + ((a.x + b.x) / 2 - v.x) * soft, y: v.y + ((a.y + b.y) / 2 - v.y) * soft }, b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function rocket(g: SVGGElement, h: number, hand: Hand): void {
  const { r } = hand;
  const half = h * between(r, 0.13, 0.19); // half the body width
  const shoulder = h * between(r, 0.27, 0.36); // where the nose meets the body
  const base = h * between(r, 0.68, 0.74);
  const pts: XY[] = [{ x: 0, y: 3 }, { x: half, y: shoulder }, { x: half, y: base }, { x: -half, y: base }, { x: -half, y: shoulder }, { x: 0, y: 3 }];
  stroke(g, r() < 0.5 ? pts : pts.reverse(), hand, 'body', 0.7, 8);
  const spread = h * between(r, 0.27, 0.36);
  const finTop = h * between(r, 0.48, 0.58);
  const finTip = h * between(r, 0.77, 0.86);
  for (const dir of [1, -1]) {
    stroke(g, [{ x: dir * half, y: finTop }, { x: dir * spread, y: finTip }, { x: dir * half, y: base }], hand, `fin${dir}`, 0.6, 8);
  }
  const win = between(r, 3, 5.5);
  const wy = h * between(r, 0.36, 0.46);
  const wx = (r() - 0.5) * half * 0.5;
  const porthole: XY[] = [{ x: wx - win, y: wy }, { x: wx + win, y: wy - win * 0.9 }, { x: wx + win, y: wy + win * 1.1 }, { x: wx - win, y: wy + win * 1.2 }, { x: wx - win, y: wy }];
  stroke(g, r() < 0.5 ? porthole : rounded(porthole, win * 0.6), hand, 'win', 0.4, 5, hand.pen - 0.3);
  const flames = r() < 0.4 ? 2 : 3;
  for (let i = 0; i < flames; i++) {
    const k = i - (flames - 1) / 2;
    const x = k * half * between(r, 0.45, 0.7);
    const len = h * between(r, 0.12, 0.24) * (k === 0 ? 1.3 : 1);
    stroke(g, [{ x, y: base + 4 }, { x: x + k * between(r, 1, 5), y: base + 4 + len }], hand, `fl${i}`, 0.8, 6);
  }
}

/**
 * The pointed S everyone drew in the margins, as it ends up after some practice: two ribbon strokes, one from the
 * right notch up over the point and down the left to the middle, the other its mirror. Each is one motion of the
 * pen, so the corners are turned rather than stopped on. In the units of a 6 x 10 box.
 */
function ess(g: SVGGElement, h: number, hand: Hand): void {
  const { r } = hand;
  const u = (h - 6) / 10;
  const wide = between(r, 0.9, 1.2); // a lanky S or a squat one
  const notch = between(r, 1.2, 2); // how far the middle lines cut in
  const point = between(r, -0.3, 0.3); // a sharper or blunter tip
  const tail = between(r, 0, 0.4); // the middle lines run on a little past the bar
  const radius = u * between(r, 0.3, 0.8); // how much the pen rounds each corner
  const at = (x: number, y: number): XY => ({ x: (x - 3) * u * wide, y: 3 + y * u });
  const upper: XY[] = [at(6 - notch, 5), at(6, 4), at(6, 2), at(3, point), at(0, 2), at(0, 4), at(3, 6), at(3, 8 + tail)];
  const lower: XY[] = [at(3, 2 - tail), at(3, 4), at(6, 6), at(6, 8), at(3, 10 - point), at(0, 8), at(0, 6), at(notch, 5)];
  const strokes = r() < 0.5 ? [upper, lower] : [lower, upper];
  strokes.forEach((pts, i) => stroke(g, rounded(pts, radius), hand, `ribbon${i}`, 0.35, 10));
}

/** A wireframe cube: the front square, the back square up and to one side, then the four edges between them. */
function cube(g: SVGGElement, h: number, hand: Hand): void {
  const { r } = hand;
  const s = h * between(r, 0.54, 0.64);
  const d = h * between(r, 0.18, 0.32);
  const dir = r() < 0.5 ? 1 : -1; // the back square sits up and to the right, or up and to the left
  const front = { x: -(s + d) / 2 + (dir > 0 ? 0 : d), y: (h - s - d) / 2 + d };
  const back = { x: front.x + dir * d, y: front.y - d };
  const square = (x: number, y: number, tag: string) => {
    const o = 2 + r() * 3; // the closing stroke overshoots the corner
    const pts: XY[] = [{ x: x + o, y }, { x: x + s, y }, { x: x + s, y: y + s }, { x, y: y + s }, { x, y: y - 2 }, { x: x + o + 4, y: y - 1 }];
    stroke(g, pts, hand, tag, 0.9, 9);
  };
  square(front.x, front.y, 'front');
  square(back.x, back.y, 'back');
  const corners: XY[] = [{ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: 0, y: s }];
  corners.forEach((c, i) => {
    const from = { x: front.x + c.x, y: front.y + c.y };
    const to = { x: back.x + c.x, y: back.y + c.y };
    stroke(g, r() < 0.5 ? [from, to] : [to, from], hand, `edge${i}`, 0.6, 8);
  });
}

/**
 * An 8 gone over and over: a vertical figure of eight traced a few laps in one motion, each lap wandering a little,
 * so the loops thicken into a scribbled knot rather than lining up.
 */
function eight(g: SVGGElement, h: number, hand: Hand): void {
  const { r } = hand;
  const laps = 3 + Math.floor(r() * 3);
  const a = h * between(r, 0.12, 0.19);
  const b = h * between(r, 0.38, 0.45);
  const cy = h / 2;
  const per = 40; // points per lap
  const phase = [r() * 6, r() * 6, r() * 6, r() * 6];
  const wander = between(r, 0.08, 0.2); // how far each lap strays from the last
  const side = r() < 0.5 ? 1 : -1; // which way round the loops go
  const pts: XY[] = [];
  for (let i = 0; i <= laps * per; i++) {
    const t = (i / per) * Math.PI * 2;
    const slow = t * 0.31; // a low-frequency wander, so each lap sits a little off the last
    const ax = a * (1 + wander * Math.sin(slow + phase[0]));
    const by = b * (1 + wander * 0.4 * Math.sin(slow * 0.7 + phase[1]));
    const dx = 2.5 * Math.sin(slow * 0.9 + phase[2]);
    const dy = 2 * Math.sin(slow * 0.6 + phase[3]);
    pts.push({ x: dx + side * ax * Math.sin(2 * t), y: cy + dy - by * Math.sin(t) });
  }
  // The pen comes in from one side and leaves off the last loop.
  pts.unshift({ x: -side * a * between(r, 1.3, 1.9), y: cy + b * between(r, 0.2, 0.5) });
  stroke(g, pts, hand, 'pen', 0.5, 1000);
}
