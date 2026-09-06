// The SF <-> NYC doodle: one plane rides the dotted arc. Landing in NYC, the label gives way to a skyline
// that draws itself building by building; it undraws, the plane turns and flies home, and the Golden Gate
// draws at SF. Everything is pen-style ink, driven by one clock so strokes, fades, and the plane stay in sync.

import { ink, svgEl, wobbly, type XY } from './doodle.js';

const PERIOD = 12; // seconds per round trip

// Timeline in seconds. Cities start drawing as the plane approaches and undraw as it leaves.
const T = {
  fly1: [0.0, 4.0],
  sfUndraw: [0.0, 1.0],
  sfBack: [0.8, 1.2],
  nycFade: [3.1, 3.5],
  nycDraw: [3.2, 4.4],
  turn1: [5.6, 6.0],
  fly2: [6.0, 10.0],
  nycUndraw: [6.0, 7.0],
  nycBack: [6.8, 7.2],
  sfFade: [9.1, 9.5],
  sfDraw: [9.2, 10.4],
  turn2: [11.6, 12.0],
} as const;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const between = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

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

/** Advances every stroke and returns the group's mean progress, which drives the paper backing behind it. */
function setProgress(strokes: Stroke[], t: number): number {
  let sum = 0;
  for (const s of strokes) {
    let p: number;
    if (t < s.draw[0]) p = 0;
    else if (t < s.draw[1]) p = ease(between(t, s.draw));
    else if (t < s.undraw[0]) p = 1;
    else if (t < s.undraw[1]) p = 1 - ease(between(t, s.undraw));
    else p = 0;
    s.el.style.strokeDashoffset = `${s.len * (1 - p)}`;
    sum += p;
  }
  return strokes.length ? sum / strokes.length : 0;
}

/** A lower-Manhattan-ish skyline in a box `W` wide, `H` tall, standing on y = 0 at x = 0. */
function skyline(W: number, H: number, seed: string): SVGPathElement[] {
  const b = (x: number, w: number, h: number, top: 'flat' | 'spire' | 'antenna' | 'taper'): XY[] => {
    const pts: XY[] = [{ x, y: 0 }, { x, y: -h }];
    if (top === 'spire') {
      pts.push({ x: x + w * 0.3, y: -h }, { x: x + w * 0.3, y: -h - H * 0.1 }, { x: x + w * 0.5, y: -h - H * 0.1 });
      pts.push({ x: x + w * 0.5, y: -h - H * 0.28 }, { x: x + w * 0.5, y: -h - H * 0.1 }, { x: x + w * 0.7, y: -h - H * 0.1 }, { x: x + w * 0.7, y: -h });
    } else if (top === 'antenna') {
      pts.push({ x: x + w * 0.5, y: -h - H * 0.12 }, { x: x + w * 0.5, y: -h - H * 0.3 }, { x: x + w * 0.5, y: -h - H * 0.12 });
    } else if (top === 'taper') {
      pts.push({ x: x + w * 0.35, y: -h - H * 0.12 }, { x: x + w * 0.5, y: -h - H * 0.24 }, { x: x + w * 0.65, y: -h - H * 0.12 });
    }
    pts.push({ x: x + w, y: -h }, { x: x + w, y: 0 });
    return pts;
  };
  const specs: [number, number, number, 'flat' | 'spire' | 'antenna' | 'taper'][] = [
    [0.0, 0.1, 0.42, 'flat'],
    [0.12, 0.08, 0.62, 'flat'],
    [0.22, 0.14, 0.72, 'spire'],
    [0.38, 0.09, 0.5, 'flat'],
    [0.49, 0.12, 0.66, 'taper'],
    [0.63, 0.1, 0.46, 'flat'],
    [0.75, 0.13, 0.7, 'antenna'],
    [0.9, 0.1, 0.36, 'flat'],
  ];
  return specs.map(([x, w, h, top], i) => ink(wobbly(b(x * W, w * W, h * H, top), `${seed}:b${i}`, 0.5, 5), 1.7));
}

/** The Golden Gate in a box `W` wide, `H` tall, standing on y = 0 at x = 0. */
function goldenGate(W: number, H: number, seed: string): SVGPathElement[] {
  const deckY = -H * 0.34;
  const towerX = [W * 0.3, W * 0.7];
  const tw = W * 0.045;
  const els: SVGPathElement[] = [];
  const cableAt = (x: number): number => {
    // Parabola between the towers, straight runs to the anchors outside them.
    if (x < towerX[0]) return -H + ((towerX[0] - x) / towerX[0]) * (H * 0.45);
    if (x > towerX[1]) return -H + ((x - towerX[1]) / (W - towerX[1])) * (H * 0.45);
    const u = (x - towerX[0]) / (towerX[1] - towerX[0]);
    return -H + 4 * u * (1 - u) * (H * 0.5);
  };
  const cable = (x0: number, x1: number, key: string) => {
    const pts: XY[] = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      pts.push({ x, y: cableAt(x) });
    }
    return ink(wobbly(pts, `${seed}:${key}`, 0.4, 6), 1.7);
  };
  const tower = (x: number, key: string) => {
    const legs: XY[] = [{ x: x - tw, y: 0 }, { x: x - tw, y: -H }, { x: x + tw, y: -H }, { x: x + tw, y: 0 }];
    const parts = [ink(wobbly(legs, `${seed}:${key}`, 0.4, 5), 1.8)];
    for (const f of [0.5, 0.72, 0.92]) parts.push(ink(wobbly([{ x: x - tw, y: -H * f }, { x: x + tw, y: -H * f }], `${seed}:${key}${f}`, 0.3, 4), 1.5));
    return parts;
  };
  els.push(cable(0, towerX[0], 'c0'));
  els.push(...tower(towerX[0], 't0'));
  els.push(cable(towerX[0], towerX[1], 'c1'));
  els.push(...tower(towerX[1], 't1'));
  els.push(cable(towerX[1], W, 'c2'));
  els.push(ink(wobbly([{ x: 0, y: deckY }, { x: W, y: deckY }], `${seed}:deck`, 0.5, 8), 1.8));
  for (let x = W * 0.08; x < W; x += W * 0.08) {
    if (Math.abs(x - towerX[0]) < tw * 1.5 || Math.abs(x - towerX[1]) < tw * 1.5) continue;
    els.push(ink(wobbly([{ x, y: cableAt(x) }, { x, y: deckY }], `${seed}:s${x.toFixed(0)}`, 0.3, 5), 1.2));
  }
  // A couple of waves under the deck.
  for (const [x0, y] of [[W * 0.1, -H * 0.12], [W * 0.55, -H * 0.08]] as [number, number][]) {
    const pts: XY[] = [];
    for (let i = 0; i <= 6; i++) pts.push({ x: x0 + i * W * 0.04, y: y + (i % 2 ? -H * 0.04 : 0) });
    els.push(ink(wobbly(pts, `${seed}:w${x0.toFixed(0)}`, 0.2, 4), 1.4));
  }
  return els;
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
  const backing = (wd: number, ht: number) =>
    svgEl('rect', { x: -3, y: -ht - 4, width: wd + 6, height: ht + 8, fill: 'var(--paper)', opacity: 0 });
  const nyc = svgEl('g', { transform: `translate(${(toRight - cityW).toFixed(1)} ${(to.y + size * 0.95).toFixed(1)})` });
  const nycStrokes = skyline(cityW, cityH, `${seed}:nyc`);
  const nycBacking = backing(cityW, cityH * 1.05);
  nyc.append(nycBacking, ...nycStrokes);
  const sf = svgEl('g', { transform: `translate(${(from.x - size * 0.3).toFixed(1)} ${baseline.toFixed(1)})` });
  const sfStrokes = goldenGate(cityW * 1.1, cityH * 0.9, `${seed}:sf`);
  const sfBacking = backing(cityW * 1.1, cityH * 0.9);
  sf.append(sfBacking, ...sfStrokes);
  svg.append(nyc, sf);

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
  svg.append(plane);
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
    toText.style.opacity = `${1 - between(t, T.nycFade) + between(t, T.nycBack)}`;
    fromText.style.opacity = `${1 - between(t, T.sfFade) + between(t, T.sfBack)}`;
    nycBacking.style.opacity = `${Math.min(1, setProgress(nycInk, t) * 1.6)}`;
    sfBacking.style.opacity = `${Math.min(1, setProgress(sfInk, t) * 1.6)}`;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  frame(start);

  return { w, h: from.y + size * 1.05, stop: () => cancelAnimationFrame(raf) };
}
