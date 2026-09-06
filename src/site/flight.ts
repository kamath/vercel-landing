// The SF <-> NYC doodle: one plane rides the dotted arc. Landing in NYC, the label gives way to a skyline
// that draws itself building by building; it undraws, the plane turns and flies home, and the Golden Gate
// draws at SF. Everything is pen-style ink, driven by one clock so strokes, fades, and the plane stay in sync.

import { ink, svgEl, wobbly, type XY } from './doodle.js';

const PERIOD = 12; // seconds per round trip

// Timeline in seconds. Cities start drawing as the plane approaches and undraw as it leaves.
const T = {
  fly1: [0.0, 4.0],
  sfUndraw: [0.0, 2.5],
  sfBack: [2.2, 2.6],
  nycFade: [2.5, 2.9],
  nycDraw: [2.6, 3.8],
  nycApproach: [3.2, 3.95],
  turn1: [5.6, 6.0],
  fly2: [6.0, 10.0],
  nycUndraw: [6.0, 7.0],
  nycBack: [6.8, 7.2],
  sfFade: [8.5, 8.9],
  sfDraw: [8.6, 9.8],
  sfApproach: [9.2, 9.95],
  turn2: [11.6, 12.0],
} as const;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const between = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

/** Opacity of a label that fades out over `out` and back in over `back`, either window possibly wrapping the loop. */
function labelOpacity(t: number, out: readonly [number, number], back: readonly [number, number]): number {
  const tt = (t - out[0] + PERIOD) % PERIOD;
  const outLen = out[1] - out[0];
  const backAt = (back[0] - out[0] + PERIOD) % PERIOD;
  const backLen = back[1] - back[0];
  if (tt < outLen) return 1 - ease(tt / outLen);
  if (tt < backAt) return 0;
  if (tt < backAt + backLen) return ease((tt - backAt) / backLen);
  return 1;
}

interface Stroke {
  el: SVGPathElement;
  len: number;
  draw: [number, number];
  undraw: [number, number];
}

/** Give a group of strokes staggered draw/undraw windows, left to right, then right to left. */
function schedule(els: SVGPathElement[], draw: readonly [number, number], undraw: readonly [number, number]): Stroke[] {
  const n = els.length;
  const per = (draw[1] - draw[0]) * 0.5;
  const step = n > 1 ? ((draw[1] - draw[0]) * 0.5) / (n - 1) : 0;
  const uper = (undraw[1] - undraw[0]) * 0.5;
  const ustep = n > 1 ? ((undraw[1] - undraw[0]) * 0.5) / (n - 1) : 0;
  return els.map((el, i) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    return {
      el,
      len,
      draw: [draw[0] + i * step, draw[0] + i * step + per],
      undraw: [undraw[0] + (n - 1 - i) * ustep, undraw[0] + (n - 1 - i) * ustep + uper],
    };
  });
}

/** Advances every stroke and returns the group's mean progress (used to hide the plane inside a drawn city). */
function setProgress(strokes: Stroke[], t: number): number {
  let sum = 0;
  for (const s of strokes) {
    // Work in a frame that starts at this stroke's draw, so an undraw window that wraps past the loop end still follows it.
    const tt = (t - s.draw[0] + PERIOD) % PERIOD;
    const drawLen = s.draw[1] - s.draw[0];
    const undrawAt = (s.undraw[0] - s.draw[0] + PERIOD) % PERIOD;
    const undrawLen = s.undraw[1] - s.undraw[0];
    let p: number;
    if (tt < drawLen) p = ease(tt / drawLen);
    else if (tt < undrawAt) p = 1;
    else if (tt < undrawAt + undrawLen) p = 1 - ease((tt - undrawAt) / undrawLen);
    else p = 0;
    s.el.style.strokeDashoffset = `${s.len * (1 - p)}`;
    if (s.el.dataset.solid) s.el.style.fillOpacity = `${Math.min(1, p * 1.3)}`;
    sum += p;
  }
  return strokes.length ? sum / strokes.length : 0;
}

/** Three New York landmarks in a box `W` wide, `H` tall, standing on y = 0 at x = 0: Chrysler, Empire State, One WTC. */
function skyline(W: number, H: number, seed: string): SVGPathElement[] {
  const chrysler = (x: number, w: number, h: number): XY[] => [
    { x, y: 0 }, { x, y: -h },
    { x: x + w * 0.12, y: -h - H * 0.06 }, { x: x + w * 0.28, y: -h - H * 0.06 },
    { x: x + w * 0.34, y: -h - H * 0.15 }, { x: x + w * 0.44, y: -h - H * 0.15 },
    { x: x + w * 0.5, y: -h - H * 0.34 },
    { x: x + w * 0.56, y: -h - H * 0.15 }, { x: x + w * 0.66, y: -h - H * 0.15 },
    { x: x + w * 0.72, y: -h - H * 0.06 }, { x: x + w * 0.88, y: -h - H * 0.06 },
    { x: x + w, y: -h }, { x: x + w, y: 0 },
  ];
  const empire = (x: number, w: number, h: number): XY[] => [
    { x, y: 0 }, { x, y: -h * 0.82 }, { x: x + w * 0.12, y: -h * 0.82 }, { x: x + w * 0.12, y: -h },
    { x: x + w * 0.36, y: -h }, { x: x + w * 0.36, y: -h - H * 0.1 }, { x: x + w * 0.46, y: -h - H * 0.1 },
    { x: x + w * 0.5, y: -h - H * 0.34 },
    { x: x + w * 0.54, y: -h - H * 0.1 }, { x: x + w * 0.64, y: -h - H * 0.1 }, { x: x + w * 0.64, y: -h },
    { x: x + w * 0.88, y: -h }, { x: x + w * 0.88, y: -h * 0.82 }, { x: x + w, y: -h * 0.82 }, { x: x + w, y: 0 },
  ];
  const wtc = (x: number, w: number, h: number): XY[] => [
    { x, y: 0 }, { x: x + w * 0.06, y: -h }, { x: x + w * 0.5, y: -h }, { x: x + w * 0.5, y: -h - H * 0.3 },
    { x: x + w * 0.5, y: -h }, { x: x + w * 0.94, y: -h }, { x: x + w, y: 0 },
  ];
  const shapes = [
    chrysler(0.02 * W, 0.24 * W, 0.62 * H),
    empire(0.36 * W, 0.26 * W, 0.78 * H),
    wtc(0.7 * W, 0.28 * W, 0.86 * H),
  ];
  return shapes.map((pts, i) => solid(ink(wobbly(pts, `${seed}:b${i}`, 0.5, 5), 1.7)));
}

/** A closed pen shape that hides whatever is behind it once drawn (the fill fades in with the stroke). */
function solid(el: SVGPathElement): SVGPathElement {
  el.setAttribute('fill', 'var(--paper)');
  el.style.fillOpacity = '0';
  el.dataset.solid = '1';
  return el;
}

/**
 * The Golden Gate in a few pen strokes: one closed silhouette (cable arch over two poles, wavy waterline)
 * whose paper fill hides whatever is behind it, plus the two poles inked on top. Box `W` x `H`, standing on y = 0.
 */
function goldenGate(W: number, H: number, seed: string): SVGPathElement[] {
  const towerX = [W * 0.28, W * 0.72];
  const waterY = -H * 0.1;
  const cableAt = (x: number): number => {
    if (x < towerX[0]) return -H + ((towerX[0] - x) / towerX[0]) * (H * 0.5);
    if (x > towerX[1]) return -H + ((x - towerX[1]) / (W - towerX[1])) * (H * 0.5);
    const u = (x - towerX[0]) / (towerX[1] - towerX[0]);
    return -H + 4 * u * (1 - u) * (H * 0.55);
  };
  const outline: XY[] = [{ x: 0, y: waterY }];
  for (let i = 0; i <= 24; i++) {
    const x = (W * i) / 24;
    outline.push({ x, y: cableAt(x) });
  }
  outline.push({ x: W, y: waterY });
  for (let i = 10; i >= 0; i--) outline.push({ x: (W * i) / 10, y: waterY + (i % 2 ? -H * 0.05 : 0) });
  const pole = (x: number, key: string) => ink(wobbly([{ x, y: waterY }, { x, y: -H }], `${seed}:${key}`, 0.5, 6), 2);
  return [solid(ink(wobbly(outline, `${seed}:outline`, 0.5, 6), 1.8)), pole(towerX[0], 'p0'), pole(towerX[1], 'p1')];
}

export interface FlightScene {
  w: number;
  h: number;
  stop: () => void;
}

export function drawFlight(
  svg: SVGSVGElement,
  w: number,
  grid: number,
  seed: string,
  labels: { from: string; to: string },
  textEl: (x: number, y: number, size: number, content: string) => SVGTextElement,
  labelWidth: (text: string, size: number) => number,
): FlightScene {
  const size = grid * 0.78;
  const h = w * 0.5;
  const from: XY = { x: w * 0.06, y: h * 0.78 };
  const to: XY = { x: w * 0.94, y: h * 0.76 };
  const ctrl: XY = { x: w * 0.5, y: -h * 0.1 };
  const q = (t: number): XY => ({
    x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x,
    y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y,
  });
  const angle = (t: number): number => {
    const dx = 2 * (1 - t) * (ctrl.x - from.x) + 2 * t * (to.x - ctrl.x);
    const dy = 2 * (1 - t) * (ctrl.y - from.y) + 2 * t * (to.y - ctrl.y);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const path = ink(`M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`, 2);
  path.setAttribute('stroke-dasharray', '7 8');
  svg.append(path);

  const labelSize = size * 0.85;
  const baseline = from.y + size * 0.95;
  const fromText = textEl(from.x - size * 0.3, baseline, labelSize, labels.from);
  const toW = labelWidth(labels.to, labelSize);
  const toRight = to.x + size * 0.3;
  const toText = textEl(toRight - toW, to.y + size * 0.95, labelSize, labels.to);
  svg.append(fromText, toText);

  // City drawings stand on the label baselines, in place of the labels.
  const cityW = w * 0.34;
  const cityH = w * 0.2;
const nyc = svgEl('g', { transform: `translate(${(toRight - cityW).toFixed(1)} ${(to.y + size * 0.95).toFixed(1)})` });
  const nycStrokes = skyline(cityW, cityH, `${seed}:nyc`);
  nyc.append(...nycStrokes);
  const sf = svgEl('g', { transform: `translate(${(from.x - size * 0.3).toFixed(1)} ${baseline.toFixed(1)})` });
  const sfStrokes = goldenGate(cityW * 1.1, cityH * 0.9, `${seed}:sf`);
  sf.append(...sfStrokes);

  const s = size * 0.55;
  const plane = ink(
    wobbly(
      [
        { x: -s, y: 0 }, { x: s * 0.9, y: 0 }, { x: s * 0.2, y: -s * 0.75 }, { x: -s * 0.2, y: -s * 0.75 }, { x: -s * 0.05, y: 0 },
        { x: -s * 0.2, y: s * 0.75 }, { x: s * 0.2, y: s * 0.75 }, { x: s * 0.9, y: 0 },
      ],
      `${seed}:plane`,
      0.5,
      6,
    ),
    2,
  );
  svg.append(plane, nyc, sf); // cities stack above the plane, so a drawn city covers it
  const place = (t: number, extraAngle: number) => {
    const p = q(t);
    plane.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(angle(t) + extraAngle).toFixed(1)})`);
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    place(0.4, 0);
    nyc.remove();
    sf.remove();
    return { w, h: from.y + size * 1.05, stop: () => {} };
  }

  const nycInk = schedule(nycStrokes, T.nycDraw, T.nycUndraw);
  const sfInk = schedule(sfStrokes, T.sfDraw, T.sfUndraw);
  const start = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = ((now - start) / 1000) % PERIOD;
    // Plane.
    if (t < T.fly1[0]) place(0, 0);
    else if (t < T.fly1[1]) place(ease(between(t, T.fly1)), 0);
    else if (t < T.turn1[0]) place(1, 0);
    else if (t < T.turn1[1]) place(1, 180 * ease(between(t, T.turn1)));
    else if (t < T.fly2[1]) place(1 - ease(between(t, T.fly2)), 180);
    else if (t < T.turn2[0]) place(0, 180);
    else place(0, 180 + 180 * ease(between(t, T.turn2)));
    // Labels give way to the drawings and come back.
    toText.style.opacity = `${labelOpacity(t, T.nycFade, T.nycBack)}`;
    fromText.style.opacity = `${labelOpacity(t, T.sfFade, T.sfBack)}`;
    const nycUp = setProgress(nycInk, t);
    const sfUp = setProgress(sfInk, t);
    // Parked inside a drawn city the plane is out of sight; in the air it is always visible (the city's
    // solid shapes sit above it, so it disappears into the skyline on approach and emerges on departure).
    let visible: number;
    if (t < T.fly1[1]) visible = Math.min(1, t / 0.4) * (1 - between(t, T.nycApproach)); // fades out on approach
    else if (t < T.turn1[1]) visible = 1 - Math.min(1, nycUp * 2);
    else if (t < T.fly2[1]) visible = Math.min(1, (t - T.fly2[0]) / 0.4) * (1 - between(t, T.sfApproach));
    else visible = 1 - Math.min(1, sfUp * 2);
    plane.style.opacity = `${visible}`;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  frame(start);

  return { w, h: from.y + size * 1.05, stop: () => cancelAnimationFrame(raf) };
}
