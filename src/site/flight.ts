// The SF <-> NYC doodle: the dotted arc draws itself from SF to NYC. On arrival the label gives way to a skyline
// that draws itself building by building; it undraws as the arc retracts home, and the Golden Gate draws at SF.
// Everything is pen-style ink, driven by one clock so strokes, fades, and the travelling line stay in sync.

import { ink, svgEl, wobbly, type XY } from './doodle.js';

const PERIOD = 7.8; // seconds per round trip

// Timeline in seconds. Cities draw in just before the line arrives, hold briefly, and fade as it sets off again.
const T = {
  fly1: [0.0, 3.6],
  sfUndraw: [0.0, 0.7],
  nycDraw: [2.4, 3.5],
  nycUndraw: [3.9, 4.6],
  fly2: [3.9, 7.5],
  sfDraw: [6.3, 7.4],
} as const;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const between = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

/** Opacity of a drawing that fades out over `undraw`, measured from the start of its `draw` window (may wrap the loop). */
function drawingOpacity(t: number, draw: readonly [number, number], undraw: readonly [number, number]): number {
  const tt = (t - draw[0] + PERIOD) % PERIOD;
  const undrawAt = (undraw[0] - draw[0] + PERIOD) % PERIOD;
  const undrawLen = undraw[1] - undraw[0];
  if (tt < undrawAt) return 1;
  if (tt < undrawAt + undrawLen) return 1 - ease((tt - undrawAt) / undrawLen);
  return 1;
}

interface Stroke {
  el: SVGPathElement;
  len: number;
  draw: [number, number];
  undraw: [number, number];
}

/** Give a group of strokes staggered draw windows (left to right); they all stay inked until the shared undraw window ends. */
function schedule(els: SVGPathElement[], draw: readonly [number, number], undraw: readonly [number, number]): Stroke[] {
  const n = els.length;
  const per = (draw[1] - draw[0]) * 0.5;
  const step = n > 1 ? ((draw[1] - draw[0]) * 0.5) / (n - 1) : 0;
  return els.map((el, i) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    return {
      el,
      len,
      draw: [draw[0] + i * step, draw[0] + i * step + per],
      undraw: [undraw[0], undraw[1]], // no stagger: the whole drawing fades together, nothing un-draws
    };
  });
}

/** Advances every stroke and returns the group's mean progress (used to fade the dotted line while a city is up). */
function setProgress(strokes: Stroke[], t: number): number {
  let sum = 0;
  for (const s of strokes) {
    // Work in a frame that starts at this stroke's draw, so an undraw window that wraps past the loop end still follows it.
    const tt = (t - s.draw[0] + PERIOD) % PERIOD;
    const drawLen = s.draw[1] - s.draw[0];
    const undrawAt = (s.undraw[0] - s.draw[0] + PERIOD) % PERIOD;
    const undrawLen = s.undraw[1] - s.undraw[0];
    // Strokes stay fully inked through the undraw window: the drawing fades out as a whole rather than un-drawing.
    const p = tt < drawLen ? ease(tt / drawLen) : tt < undrawAt + undrawLen ? 1 : 0;
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
 * The Golden Gate, drawn the way a hand would: water first, then the poles (two towers and a few
 * verticals), then the cable arch over everything. A paper-filled silhouette beneath hides the arc.
 * Box `W` x `H`, standing on y = 0.
 */
function goldenGate(W: number, H: number, seed: string): { fill: SVGPathElement; water: SVGPathElement[]; poles: SVGPathElement[]; arch: SVGPathElement[] } {
  const towerX = [W * 0.3, W * 0.7];
  const waterY = -H * 0.1;
  const cableAt = (x: number): number => {
    // Parabola between the towers; outside them the cable keeps going down to the anchors near the water.
    if (x < towerX[0]) return -H + ((towerX[0] - x) / towerX[0]) * (H * 0.78);
    if (x > towerX[1]) return -H + ((x - towerX[1]) / (W - towerX[1])) * (H * 0.78);
    const u = (x - towerX[0]) / (towerX[1] - towerX[0]);
    return -H + 4 * u * (1 - u) * (H * 0.55);
  };
  const cable: XY[] = [];
  for (let i = 0; i <= 30; i++) {
    const x = (W * i) / 30;
    cable.push({ x, y: cableAt(x) });
  }
  const wave: XY[] = [];
  for (let i = 0; i <= 10; i++) wave.push({ x: (W * i) / 10, y: waterY + (i % 2 ? -H * 0.05 : 0) });

  const fill = svgEl('path', { d: wobbly([...cable, { x: W, y: waterY }, ...[...wave].reverse()], `${seed}:fill`, 0.5, 6), fill: 'var(--paper)', stroke: 'none' });
  fill.style.fillOpacity = '0';
  const water = [ink(wobbly(wave, `${seed}:water`, 0.4, 5), 1.6)];
  const pole = (x: number, top: number, width: number, key: string) =>
    ink(wobbly([{ x, y: waterY }, { x, y: top }], `${seed}:${key}`, 0.35, 5), width);
  // A scribbler draws the two towers and a handful of verticals, not every cable.
  const poles = [
    pole(W * 0.15, cableAt(W * 0.15), 1.2, 's0'),
    pole(towerX[0], -H, 2.1, 't0'),
    pole(W * 0.43, cableAt(W * 0.43), 1.2, 's1'),
    pole(W * 0.57, cableAt(W * 0.57), 1.2, 's2'),
    pole(towerX[1], -H, 2.1, 't1'),
    pole(W * 0.85, cableAt(W * 0.85), 1.2, 's3'),
  ];
  const arch = [ink(wobbly(cable, `${seed}:arch`, 0.5, 6), 1.8)];
  return { fill, water, poles, arch };
}

export interface FlightScene {
  w: number;
  h: number;
  stop: () => void;
  /** Jump the loop clock to a given second (debugging aid). */
  seek: (t: number) => void;
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
  const arcD = `M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`;

  // The dotted arc is the traveller: a mask reveals it from SF towards NYC and hides it again on the way back.
  const maskId = `${seed}-reveal`.replace(/[^a-zA-Z0-9_-]/g, '-');
  const defs = svgEl('defs');
  const mask = svgEl('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: -w, y: -h, width: w * 3, height: h * 3 });
  const reveal = svgEl('path', { d: arcD, fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-linecap': 'round' });
  mask.append(reveal);
  defs.append(mask);
  const arc = ink(arcD, 2);
  arc.setAttribute('stroke-dasharray', '7 8');
  arc.setAttribute('mask', `url(#${maskId})`);
  svg.append(defs, arc);
  const arcLen = reveal.getTotalLength();
  reveal.style.strokeDasharray = `${arcLen}`;

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
  const bridge = goldenGate(cityW * 1.1, cityH * 0.9, `${seed}:sf`);
  const sfStrokes = [...bridge.water, ...bridge.poles, ...bridge.arch];
  sf.append(bridge.fill, ...sfStrokes);
  svg.append(nyc, sf);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    reveal.style.strokeDashoffset = '0';
    nyc.remove();
    sf.remove();
    return { w, h: from.y + size * 1.05, stop: () => {}, seek: () => {} };
  }

  const phase = (a: number, b: number, [d0, d1]: readonly [number, number]): [number, number] => [d0 + (d1 - d0) * a, d0 + (d1 - d0) * b];
  const nycInk = schedule(nycStrokes, T.nycDraw, T.nycUndraw);
  const sfInk = [
    ...schedule(bridge.water, phase(0, 0.2, T.sfDraw), T.sfUndraw),
    ...schedule(bridge.poles, phase(0.18, 0.72, T.sfDraw), T.sfUndraw),
    ...schedule(bridge.arch, phase(0.7, 1, T.sfDraw), T.sfUndraw),
  ];
  const MARCH = 15; // px per second the dashes travel, one dash-plus-gap period per second
  let start = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = ((now - start) / 1000) % PERIOD;
    // The line draws itself out from SF, later back from NYC, dashes marching the way it is heading.
    let offset: number;
    let march: number;
    if (t < T.fly1[1]) {
      offset = arcLen * (1 - ease(between(t, T.fly1)));
      march = -MARCH * (t - T.fly1[0]);
    } else if (t < T.fly2[0]) {
      offset = 0;
      march = -MARCH * (T.fly1[1] - T.fly1[0]);
    } else if (t < T.fly2[1]) {
      offset = -arcLen * (1 - ease(between(t, T.fly2))); // negative: revealed from the NYC end
      march = MARCH * (t - T.fly2[0]);
    } else {
      offset = 0;
      march = MARCH * (T.fly2[1] - T.fly2[0]);
    }
    reveal.style.strokeDashoffset = `${offset}`;
    arc.style.strokeDashoffset = `${march}`;
    const nycFade = drawingOpacity(t, T.nycDraw, T.nycUndraw);
    const sfFade = drawingOpacity(t, T.sfDraw, T.sfUndraw);
    nyc.style.opacity = `${nycFade}`;
    sf.style.opacity = `${sfFade}`;
    const nycUp = setProgress(nycInk, t) * nycFade;
    const sfUp = setProgress(sfInk, t) * sfFade;
    bridge.fill.style.fillOpacity = `${Math.min(1, sfUp * 1.5)}`;
    // The dotted line and both city labels fade out together as a city draws in, and return as it fades away.
    const line = 1 - Math.min(1, Math.max(nycUp, sfUp) * 1.5);
    arc.style.opacity = `${line}`;
    fromText.style.opacity = `${line}`;
    toText.style.opacity = `${line}`;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  frame(start);

  return {
    w,
    h: from.y + size * 1.05,
    stop: () => cancelAnimationFrame(raf),
    seek: (t) => {
      start = performance.now() - t * 1000;
      frame(performance.now());
    },
  };
}
