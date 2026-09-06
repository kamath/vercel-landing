// The SF <-> NYC doodle: the dotted arc draws itself from SF to NYC. On arrival the label gives way to a skyline
// that draws itself building by building; it undraws as the arc retracts home, and the Golden Gate draws at SF.
// Everything is pen-style ink, driven by one clock so strokes, fades, and the travelling line stay in sync.

import { ink, svgEl, wobbly, type XY } from './doodle.js';

const PERIOD = 12; // seconds per round trip

// Timeline in seconds. Cities draw in as the line arrives and undraw as it sets off again.
const T = {
  fly1: [0.0, 4.0],
  sfUndraw: [0.0, 2.5],
  sfBack: [2.2, 2.6],
  nycFade: [2.5, 2.9],
  nycDraw: [2.6, 3.8],
  fly2: [6.0, 10.0],
  nycUndraw: [6.0, 7.0],
  nycBack: [6.8, 7.2],
  sfFade: [8.5, 8.9],
  sfDraw: [8.6, 9.8],
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
function skyline(W: number, H: number, seed: string): { outlines: SVGPathElement[]; windows: SVGPathElement[] } {
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
  const outlines = shapes.map((pts, i) => solid(ink(wobbly(pts, `${seed}:b${i}`, 0.5, 5), 1.7)));
  // Window dashes: two columns and a few rows inside each building, inked after the outline.
  const windows: SVGPathElement[] = [];
  const boxes: [number, number, number][] = [[0.02 * W, 0.24 * W, 0.62 * H], [0.36 * W, 0.26 * W, 0.78 * H], [0.7 * W, 0.28 * W, 0.86 * H]];
  boxes.forEach(([x, w, h], b) => {
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const y = -h * (0.22 + (r * 0.55) / (rows - 1));
      for (const c of [0.3, 0.7]) {
        const cx = x + w * c;
        windows.push(ink(wobbly([{ x: cx - w * 0.1, y }, { x: cx + w * 0.1, y }], `${seed}:w${b}${r}${c}`, 0.25, 4), 1.3));
      }
    }
  });
  return { outlines, windows };
}

/** A closed pen shape that hides whatever is behind it once drawn (the fill fades in with the stroke). */
function solid(el: SVGPathElement): SVGPathElement {
  el.setAttribute('fill', 'var(--paper)');
  el.style.fillOpacity = '0';
  el.dataset.solid = '1';
  return el;
}

/**
 * The Golden Gate, drawn the way a hand would: water first, then the poles (two towers and a row of
 * suspenders), then the cable arch over everything. A paper-filled silhouette beneath hides the arc.
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
  const poles: SVGPathElement[] = [];
  const step = W / 13;
  for (let x = step * 0.7; x < W - step * 0.3; x += step) {
    const tower = towerX.find((tx) => Math.abs(tx - x) < step * 0.6);
    if (tower !== undefined) {
      poles.push(pole(tower, -H, 2.1, `t${x.toFixed(0)}`));
      for (const f of [0.55, 0.85]) {
        poles.push(ink(wobbly([{ x: tower - W * 0.03, y: -H * f }, { x: tower + W * 0.03, y: -H * f }], `${seed}:x${x.toFixed(0)}${f}`, 0.25, 4), 1.4));
      }
    } else {
      poles.push(pole(x, cableAt(x), 1.1, `s${x.toFixed(0)}`));
    }
  }
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
  const city = skyline(cityW, cityH, `${seed}:nyc`);
  nyc.append(...city.outlines, ...city.windows);
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
  const nycInk = [
    ...schedule(city.outlines, phase(0, 0.65, T.nycDraw), phase(0.35, 1, T.nycUndraw)),
    ...schedule(city.windows, phase(0.5, 1, T.nycDraw), phase(0, 0.5, T.nycUndraw)),
  ];
  const sfInk = [
    ...schedule(bridge.water, phase(0, 0.2, T.sfDraw), phase(0.8, 1, T.sfUndraw)),
    ...schedule(bridge.poles, phase(0.18, 0.72, T.sfDraw), phase(0.25, 0.85, T.sfUndraw)),
    ...schedule(bridge.arch, phase(0.7, 1, T.sfDraw), phase(0, 0.3, T.sfUndraw)),
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
    toText.style.opacity = `${labelOpacity(t, T.nycFade, T.nycBack)}`;
    fromText.style.opacity = `${labelOpacity(t, T.sfFade, T.sfBack)}`;
    const nycFade = drawingOpacity(t, T.nycDraw, T.nycUndraw);
    const sfFade = drawingOpacity(t, T.sfDraw, T.sfUndraw);
    nyc.style.opacity = `${nycFade}`;
    sf.style.opacity = `${sfFade}`;
    const nycUp = setProgress(nycInk, t) * nycFade;
    const sfUp = setProgress(sfInk, t) * sfFade;
    bridge.fill.style.fillOpacity = `${Math.min(1, sfUp * 1.5)}`;
    // The dotted line fades out as a city draws in and comes back as the city fades away.
    arc.style.opacity = `${1 - Math.min(1, Math.max(nycUp, sfUp) * 1.5)}`;
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
