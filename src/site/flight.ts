// The SF <-> NYC doodle: the dotted arc draws itself from SF to NYC. As its tip reaches the skyline, the
// skyline is drawing itself so that the building's outline and the dotted line meet at their crossing point
// at the same instant; the line fades once it has arrived, the city holds, then fades as the line sets off
// back. The same happens at SF with the Golden Gate's cable. Everything is pen-style ink on one clock, and the
// schedule is computed from the geometry (where the dotted arc crosses each drawing) rather than hard-coded.

import { ink, svgEl, wobbly, type XY } from './doodle.js';

const FLY = 3.6; // seconds for the line to draw itself across
const HOLD = 1.2; // seconds a finished city stays (while the dotted line fades out) before fading itself
const FADE = 0.7; // seconds a city takes to fade out
const NYC_DRAW = 1.1; // seconds the skyline takes to draw
const SF_DRAW = 1.6; // seconds the bridge takes to draw (poles, water, then the arch over the back half)

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
/** Inverse of `ease` (it is monotonic), by bisection. */
function easeInv(y: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const between = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

type Win = readonly [number, number];

interface Stroke {
  el: SVGPathElement;
  len: number;
  draw: Win;
  undraw: Win;
}

/** Give a group of strokes staggered draw windows (left to right); they all stay inked until the shared undraw window ends. */
function schedule(els: SVGPathElement[], draw: Win, undraw: Win, share = 0.5): Stroke[] {
  const n = els.length;
  return els.map((el, i) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    return { el, len, draw: staggered(draw, i, n, share), undraw: [undraw[0], undraw[1]] };
  });
}

/** Window of the i-th of n strokes inside a staggered draw window. */
function staggered(draw: Win, i: number, n: number, share = 0.5): Win {
  const per = (draw[1] - draw[0]) * share;
  const step = n > 1 ? ((draw[1] - draw[0]) * (1 - share)) / (n - 1) : 0;
  return [draw[0] + i * step, draw[0] + i * step + per];
}

/** Advances every stroke and returns the group's mean progress. Windows may wrap past the loop end. */
function setProgress(strokes: Stroke[], t: number, period: number): number {
  let sum = 0;
  for (const s of strokes) {
    const tt = (t - s.draw[0] + period) % period;
    const drawLen = s.draw[1] - s.draw[0];
    const undrawAt = (s.undraw[0] - s.draw[0] + period) % period;
    const undrawLen = s.undraw[1] - s.undraw[0];
    // Strokes stay fully inked through the undraw window: the drawing fades out as a whole rather than un-drawing.
    const p = tt < drawLen ? ease(tt / drawLen) : tt < undrawAt + undrawLen ? 1 : 0;
    s.el.style.strokeDashoffset = `${s.len * (1 - p)}`;
    if (s.el.dataset.solid) s.el.style.fillOpacity = `${Math.min(1, p * 1.3)}`;
    sum += p;
  }
  return strokes.length ? sum / strokes.length : 0;
}

/** Opacity of a drawing that fades out over `undraw`, measured from the start of its `draw` window (may wrap the loop). */
function drawingOpacity(t: number, draw: Win, undraw: Win, period: number): number {
  const tt = (t - draw[0] + period) % period;
  const undrawAt = (undraw[0] - draw[0] + period) % period;
  const undrawLen = undraw[1] - undraw[0];
  if (tt < undrawAt) return 1;
  if (tt < undrawAt + undrawLen) return 1 - ease((tt - undrawAt) / undrawLen);
  return 1;
}

/**
 * How much a city hides the dotted line: from the moment the pens meet, the line fades while its tip keeps
 * travelling, and is gone as it arrives; it stays hidden while the city holds and fades, and is clear again the
 * moment the city is gone (the next trip then starts from nothing). May wrap the loop.
 */
function lineHidden(t: number, meet: number, arrive: number, undraw: Win, period: number): number {
  const rampStart = meet;
  const tt = (t - rampStart + period) % period;
  const rampLen = Math.max(0.05, arrive - rampStart);
  const clearAt = (undraw[1] - rampStart + period) % period;
  if (tt < rampLen) return ease(tt / rampLen);
  if (tt < clearAt) return 1;
  return 0;
}

// ----------------------------------------------------------------------------- geometry

interface Polyline {
  pts: XY[];
  at: number[];
  len: number;
}

/** Points along a polyline with the cumulative length at each. */
function measured(pts: XY[]): Polyline {
  const at = [0];
  for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, at, len: at[at.length - 1] };
}

/** First crossing of polyline `a` with polyline `b`, walking along `a`. Returns lengths along each. */
function firstCrossing(a: Polyline, b: Polyline): { alongA: number; alongB: number } | null {
  for (let i = 0; i < a.pts.length - 1; i++) {
    const p = a.pts[i];
    const p2 = a.pts[i + 1];
    for (let j = 0; j < b.pts.length - 1; j++) {
      const q = b.pts[j];
      const q2 = b.pts[j + 1];
      const d = (p2.x - p.x) * (q2.y - q.y) - (p2.y - p.y) * (q2.x - q.x);
      if (Math.abs(d) < 1e-9) continue;
      const u = ((q.x - p.x) * (q2.y - q.y) - (q.y - p.y) * (q2.x - q.x)) / d;
      const v = ((q.x - p.x) * (p2.y - p.y) - (q.y - p.y) * (p2.x - p.x)) / d;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        return { alongA: a.at[i] + u * (a.at[i + 1] - a.at[i]), alongB: b.at[j] + v * (b.at[j + 1] - b.at[j]) };
      }
    }
  }
  return null;
}

const shift = (pts: XY[], dx: number, dy: number): XY[] => pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));

// ----------------------------------------------------------------------------- drawings

/** A closed pen shape that hides whatever is behind it once drawn (the fill fades in with the stroke). */
function solid(el: SVGPathElement): SVGPathElement {
  el.setAttribute('fill', 'var(--paper)');
  el.style.fillOpacity = '0';
  el.dataset.solid = '1';
  return el;
}

/** Three New York landmarks in a box `W` wide, `H` tall, standing on y = 0 at x = 0: Chrysler, Empire State, One WTC. */
function skyline(W: number, H: number, seed: string): { els: SVGPathElement[]; shapes: XY[][] } {
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
  const shapes = [chrysler(0.02 * W, 0.24 * W, 0.62 * H), empire(0.36 * W, 0.26 * W, 0.78 * H), wtc(0.7 * W, 0.28 * W, 0.86 * H)];
  return { shapes, els: shapes.map((pts, i) => solid(ink(wobbly(pts, `${seed}:b${i}`, 0.5, 5), 1.7))) };
}

/**
 * The Golden Gate, drawn the way a hand would: the poles (two towers and a few verticals) from the top down,
 * then the water, then one unhurried cable arch over everything. A paper-filled silhouette beneath hides the arc.
 * Box `W` x `H`, standing on y = 0.
 */
function goldenGate(
  W: number,
  H: number,
  seed: string,
): { fill: SVGPathElement; water: SVGPathElement[]; poles: SVGPathElement[]; arch: SVGPathElement[]; cable: XY[] } {
  const towerX = [W * 0.3, W * 0.7];
  const waterY = 0;
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

  const fill = svgEl('path', {
    d: wobbly([...cable, { x: W, y: waterY }, ...[...wave].reverse()], `${seed}:fill`, 0.5, 6),
    fill: 'var(--paper)',
    stroke: 'none',
  });
  fill.style.fillOpacity = '0';
  const water = [ink(wobbly(wave, `${seed}:water`, 0.4, 5), 1.6)];
  const pole = (x: number, top: number, width: number, key: string) =>
    ink(wobbly([{ x, y: top }, { x, y: waterY }], `${seed}:${key}`, 0.35, 5), width); // top down, as a hand does
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
  return { fill, water, poles, arch, cable };
}

// ----------------------------------------------------------------------------- scene

export interface FlightScene {
  w: number;
  h: number;
  stop: () => void;
  /** Jump the loop clock to a given second (debugging aid). */
  seek: (t: number) => void;
  /** The computed schedule, in seconds (debugging aid). */
  timeline: Record<string, number | Win>;
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
  const arcPts: XY[] = [];
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    arcPts.push({
      x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x,
      y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y,
    });
  }
  const arcGeom = measured(arcPts);

  // The dotted arc is the traveller: a mask reveals it from SF towards NYC, later from NYC back towards SF.
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

  // City drawings stand on the arc's end points: the bridge flush with its left end, the skyline flush with its right.
  const cityW = w * 0.34;
  const cityH = w * 0.2;
  const nycOrigin: XY = { x: to.x - cityW, y: to.y };
  const nyc = svgEl('g', { transform: `translate(${nycOrigin.x.toFixed(1)} ${nycOrigin.y.toFixed(1)})` });
  const city = skyline(cityW, cityH, `${seed}:nyc`);
  nyc.append(...city.els);
  const sfOrigin: XY = { x: from.x, y: from.y };
  const sf = svgEl('g', { transform: `translate(${sfOrigin.x.toFixed(1)} ${sfOrigin.y.toFixed(1)})` });
  const bridge = goldenGate(cityW * 1.1, cityH * 0.9, `${seed}:sf`);
  sf.append(bridge.fill, ...bridge.water, ...bridge.poles, ...bridge.arch);
  svg.append(nyc, sf);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    reveal.style.strokeDashoffset = '0';
    nyc.remove();
    sf.remove();
    return { w, h: from.y + size * 1.05, stop: () => {}, seek: () => {}, timeline: {} };
  }

  // ---- Schedule from the geometry.
  // Outbound: the tip travels from SF. Find where it first meets a building outline, work out when the tip gets
  // there and when that building's pen would, and start the skyline so both are there at the same instant.
  const fly1: Win = [0, FLY];
  let nycDraw: Win = [FLY, FLY + NYC_DRAW];
  let meetNYC = FLY;
  const hits = city.shapes
    .map((shape, i) => ({ i, hit: firstCrossing(arcGeom, measured(shift(shape, nycOrigin.x, nycOrigin.y))) }))
    .filter((c) => c.hit !== null)
    .sort((a, b) => a.hit!.alongA - b.hit!.alongA);
  if (hits.length > 0) {
    const { i, hit } = hits[0];
    meetNYC = fly1[0] + FLY * easeInv(hit!.alongA / arcLen); // when the dotted tip gets there
    const strokeLen = measured(city.shapes[i]).len;
    const win = staggered([0, NYC_DRAW], i, city.shapes.length); // building i's window, relative to the draw start
    const reach = win[0] + (win[1] - win[0]) * easeInv(hit!.alongB / strokeLen); // when its pen gets there
    nycDraw = [meetNYC - reach, meetNYC - reach + NYC_DRAW];
  }
  const nycUndraw: Win = [nycDraw[1] + HOLD, nycDraw[1] + HOLD + FADE];
  // Homeward: the tip travels from NYC and meets the bridge cable; the arch is the bridge's last stroke and takes
  // the back half of its window.
  const fly2: Win = [nycUndraw[1], nycUndraw[1] + FLY]; // sets off once the skyline is fully gone
  let sfDraw: Win = [fly2[1], fly2[1] + SF_DRAW];
  let meetSF = fly2[1];
  const cableHit = firstCrossing(measured([...arcPts].reverse()), measured(shift(bridge.cable, sfOrigin.x, sfOrigin.y)));
  if (cableHit) {
    meetSF = fly2[0] + FLY * easeInv(cableHit.alongA / arcLen);
    const cableLen = measured(bridge.cable).len;
    const archWin: Win = [SF_DRAW * 0.5, SF_DRAW]; // relative to the bridge's draw start
    const reach = archWin[0] + (archWin[1] - archWin[0]) * easeInv(cableHit.alongB / cableLen);
    sfDraw = [meetSF - reach, meetSF - reach + SF_DRAW];
  }
  const sfUndraw: Win = [sfDraw[1] + HOLD, sfDraw[1] + HOLD + FADE];
  const period = sfUndraw[1]; // the next loop's outbound line sets off once the bridge is fully gone
  const phase = (a: number, b: number, [d0, d1]: Win): Win => [d0 + (d1 - d0) * a, d0 + (d1 - d0) * b];

  const nycInk = schedule(city.els, nycDraw, nycUndraw);
  const sfInk = [
    ...schedule(bridge.poles, phase(0, 0.4, sfDraw), sfUndraw),
    ...schedule(bridge.water, phase(0.38, 0.52, sfDraw), sfUndraw, 1),
    ...schedule(bridge.arch, phase(0.5, 1, sfDraw), sfUndraw, 1),
  ];
  const timeline: Record<string, number | Win> = { period, fly1, meetNYC, nycDraw, nycUndraw, fly2, meetSF, sfDraw, sfUndraw };

  const MARCH = 45; // px per second the dashes travel, three dash-plus-gap periods per second
  let start = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = ((now - start) / 1000) % period;
    // The line draws itself out from SF, later back from NYC, dashes marching the way it is heading.
    let offset: number;
    let march: number;
    if (t < fly1[1]) {
      offset = arcLen * (1 - ease(between(t, fly1)));
      march = -MARCH * (t - fly1[0]);
    } else if (t < fly2[0]) {
      offset = 0;
      march = -MARCH * FLY;
    } else if (t < fly2[1]) {
      offset = -arcLen * (1 - ease(between(t, fly2))); // negative: revealed from the NYC end
      march = MARCH * (t - fly2[0]);
    } else {
      offset = 0;
      march = MARCH * FLY;
    }
    reveal.style.strokeDashoffset = `${offset}`;
    arc.style.strokeDashoffset = `${march}`;
    const nycFade = drawingOpacity(t, nycDraw, nycUndraw, period);
    const sfFade = drawingOpacity(t, sfDraw, sfUndraw, period);
    nyc.style.opacity = `${nycFade}`;
    sf.style.opacity = `${sfFade}`;
    setProgress(nycInk, t, period);
    bridge.fill.style.fillOpacity = `${Math.min(1, setProgress(sfInk, t, period) * sfFade * 1.5)}`;
    // The line is fully visible up to the crossing, then fades as it finishes arriving; it stays hidden while the
    // city holds and fades, and the next trip starts once the city is gone.
    const hidden = Math.max(
      lineHidden(t, meetNYC, fly1[1], nycUndraw, period),
      lineHidden(t, meetSF, fly2[1], sfUndraw, period),
    );
    arc.style.opacity = `${1 - hidden}`;
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
    timeline,
  };
}
