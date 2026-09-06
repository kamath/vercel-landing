// Small pen doodles, each three grid rows tall and centred in its block: the rocket, a pointed ribbon "S" drawn in
// straight strokes, a wireframe cube, and an 8 written over itself a few times without lifting the pen.
import { rng } from '../variants.js';
import { ink, wobbly, type XY } from './doodle.js';

export const SKETCHES = ['rocket', 'ess', 'cube', 'eight'] as const;
export type Sketch = (typeof SKETCHES)[number];

const ROWS = 3;

/** Width each doodle needs relative to its height; the block is at least this wide. */
const ASPECT: Record<Sketch, number> = { rocket: 0.7, ess: 0.6, cube: 0.9, eight: 0.55 };

export function sketchSize(kind: Sketch, w: number, grid: number): { w: number; h: number } {
  const h = grid * ROWS;
  return { w: Math.max(w, h * ASPECT[kind]), h };
}

export function drawSketch(svg: SVGSVGElement, kind: Sketch, w: number, grid: number, seed: string): { w: number; h: number } {
  const size = sketchSize(kind, w, grid);
  const cx = size.w / 2;
  const h = size.h;
  if (kind === 'rocket') rocket(svg, cx, h, seed);
  else if (kind === 'ess') ess(svg, cx, h, seed);
  else if (kind === 'cube') cube(svg, cx, h, seed);
  else eight(svg, cx, h, seed);
  return size;
}

function rocket(svg: SVGSVGElement, cx: number, h: number, seed: string): void {
  const body = wobbly(
    [
      { x: cx, y: 4 }, { x: cx + h * 0.16, y: h * 0.32 }, { x: cx + h * 0.16, y: h * 0.72 }, { x: cx - h * 0.16, y: h * 0.72 },
      { x: cx - h * 0.16, y: h * 0.32 }, { x: cx, y: 4 },
    ],
    `${seed}:body`,
    0.7,
    8,
  );
  svg.append(ink(body, 2));
  const fin = (dir: number) =>
    ink(wobbly([{ x: cx + dir * h * 0.16, y: h * 0.52 }, { x: cx + dir * h * 0.32, y: h * 0.8 }, { x: cx + dir * h * 0.16, y: h * 0.72 }], `${seed}:fin${dir}`, 0.6, 8), 2);
  svg.append(fin(1), fin(-1));
  const porthole = ink(wobbly([{ x: cx - 4, y: h * 0.4 }, { x: cx + 4, y: h * 0.36 }, { x: cx + 4, y: h * 0.46 }, { x: cx - 4, y: h * 0.47 }, { x: cx - 4, y: h * 0.4 }], `${seed}:win`, 0.4, 5), 1.8);
  svg.append(porthole);
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * h * 0.09;
    svg.append(ink(wobbly([{ x, y: h * 0.76 }, { x: x + (i - 1) * 3, y: h * (0.9 + (i === 1 ? 0.08 : 0)) }], `${seed}:fl${i}`, 0.8, 6), 2));
  }
}

/**
 * The pointed S everyone drew in the margins, built the way it is taught: three vertical lines, three more directly
 * below them, diagonals from the bottoms of the top-left two to the tops of the bottom-right two, a pointed top and
 * a pointed bottom, then the two lines that round out the middle. Every line is its own straight stroke, so the
 * corners stay sharp. In the units of a 6 x 10 box.
 */
const ESS_LINES: [XY, XY][] = [
  [{ x: 0, y: 2 }, { x: 0, y: 4 }], [{ x: 3, y: 2 }, { x: 3, y: 4 }], [{ x: 6, y: 2 }, { x: 6, y: 4 }], // three lines
  [{ x: 0, y: 6 }, { x: 0, y: 8 }], [{ x: 3, y: 6 }, { x: 3, y: 8 }], [{ x: 6, y: 6 }, { x: 6, y: 8 }], // three below
  [{ x: 0, y: 4 }, { x: 3, y: 6 }], [{ x: 3, y: 4 }, { x: 6, y: 6 }], // diagonals, top-left two to bottom-right two
  [{ x: 0, y: 2 }, { x: 3, y: 0 }], [{ x: 3, y: 0 }, { x: 6, y: 2 }], // pointy top
  [{ x: 6, y: 8 }, { x: 3, y: 10 }], [{ x: 3, y: 10 }, { x: 0, y: 8 }], // pointy bottom
  [{ x: 6, y: 4 }, { x: 4.5, y: 5 }], [{ x: 0, y: 6 }, { x: 1.5, y: 5 }], // round out the middle, stopping at the diagonals
];

function ess(svg: SVGSVGElement, cx: number, h: number, seed: string): void {
  const u = (h - 6) / 10;
  const at = (p: XY): XY => ({ x: cx + (p.x - 3) * u, y: 3 + p.y * u });
  ESS_LINES.forEach(([a, b], i) => svg.append(ink(wobbly([at(a), at(b)], `${seed}:l${i}`, 0.45, 6), 2.2)));
}

/** A wireframe cube: the front square, the back square up and to the right, then the four edges between them. */
function cube(svg: SVGSVGElement, cx: number, h: number, seed: string): void {
  const r = rng(`${seed}:cube`);
  const s = h * 0.6;
  const d = h * 0.26;
  const left = cx - (s + d) / 2;
  const top = (h - s - d) / 2;
  const square = (x: number, y: number, tag: string) => {
    const o = 2 + r() * 3; // the closing stroke overshoots the corner
    return ink(wobbly([{ x: x + o, y }, { x: x + s, y }, { x: x + s, y: y + s }, { x, y: y + s }, { x, y: y - 2 }, { x: x + o + 4, y: y - 1 }], `${seed}:${tag}`, 0.9, 9), 2);
  };
  svg.append(square(left, top + d, 'front'), square(left + d, top, 'back'));
  const corners: XY[] = [{ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: 0, y: s }];
  corners.forEach((c, i) => {
    const from = { x: left + c.x, y: top + d + c.y };
    const to = { x: left + d + c.x, y: top + c.y };
    svg.append(ink(wobbly([from, to], `${seed}:edge${i}`, 0.6, 8), 2));
  });
}

/**
 * An 8 gone over and over: a vertical figure of eight traced a few laps in one motion, each lap wandering a little,
 * so the loops thicken into a scribbled knot rather than lining up.
 */
function eight(svg: SVGSVGElement, cx: number, h: number, seed: string): void {
  const r = rng(`${seed}:eight`);
  const laps = 4;
  const a = h * 0.15;
  const b = h * 0.42;
  const cy = h / 2;
  const per = 40; // points per lap
  const phase = [r() * 6, r() * 6, r() * 6, r() * 6];
  const pts: XY[] = [];
  for (let i = 0; i <= laps * per; i++) {
    const t = (i / per) * Math.PI * 2;
    const slow = t * 0.31; // a low-frequency wander, so each lap sits a little off the last
    const ax = a * (1 + 0.14 * Math.sin(slow + phase[0]));
    const by = b * (1 + 0.05 * Math.sin(slow * 0.7 + phase[1]));
    const dx = 2.5 * Math.sin(slow * 0.9 + phase[2]);
    const dy = 2 * Math.sin(slow * 0.6 + phase[3]);
    pts.push({ x: cx + dx + ax * Math.sin(2 * t), y: cy + dy - by * Math.sin(t) });
  }
  // The pen comes in from the left and leaves off the last loop.
  pts.unshift({ x: cx - a * 1.6, y: cy + b * 0.4 });
  svg.append(ink(wobbly(pts, `${seed}:pen`, 0.5, 1000), 2));
}
