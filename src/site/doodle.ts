// Hand-drawn SVG helpers: wobbly ink paths for strikes, underlines, boxes, braces, and arrows.
import { rng } from '../variants.js';

export const SVG_NS = 'http://www.w3.org/2000/svg';

export interface XY {
  x: number;
  y: number;
}

export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** A polyline drawn by a slightly unsteady hand: subdivided, jittered sideways, smoothed. */
export function wobbly(points: XY[], seed: string, amp = 1.3, step = 12): string {
  const r = rng(seed);
  const pts: XY[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(len / step));
    const nx = -(b.y - a.y) / (len || 1);
    const ny = (b.x - a.x) / (len || 1);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const j = k === 0 && i === 0 ? 0 : (r() - 0.5) * 2 * amp;
      pts.push({ x: a.x + (b.x - a.x) * t + nx * j, y: a.y + (b.y - a.y) * t + ny * j });
    }
  }
  pts.push(points[points.length - 1]);
  if (pts.length < 3) return `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}`;
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += `Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

export function ink(d: string, width = 2.1): SVGPathElement {
  return svgEl('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
}

export function strike(x1: number, x2: number, y: number, seed: string): SVGPathElement {
  const r = rng(seed + ':s');
  return ink(wobbly([{ x: x1 - 3, y: y + (r() - 0.5) * 3 }, { x: x2 + 4, y: y + (r() - 0.5) * 4 }], seed, 1.1), 2.2);
}

export function underline(x1: number, x2: number, y: number, seed: string): SVGPathElement {
  const r = rng(seed + ':u');
  return ink(wobbly([{ x: x1 - 1, y }, { x: x2 + 3, y: y + (r() - 0.5) * 3 }], seed, 0.9), 1.9);
}

/** A box whose closing stroke overshoots the start corner, as pen boxes do. */
export function box(x: number, y: number, w: number, h: number, seed: string): SVGPathElement {
  const r = rng(seed + ':b');
  const o = 4 + r() * 5;
  const pts: XY[] = [
    { x: x + o, y },
    { x: x + w, y: y + (r() - 0.5) * 3 },
    { x: x + w + (r() - 0.5) * 3, y: y + h },
    { x, y: y + h + (r() - 0.5) * 3 },
    { x: x + (r() - 0.5) * 2, y: y - 3 },
    { x: x + o + 6, y: y - 2 },
  ];
  return ink(wobbly(pts, seed, 1.2, 14), 2.2);
}

/** A left-facing curly brace spanning y1..y2 with its point at x. */
export function brace(x: number, y1: number, y2: number, seed: string): SVGPathElement {
  const mid = (y1 + y2) / 2;
  const w = 12;
  const d =
    `M${x + w} ${y1} C${x + 2} ${y1}, ${x + 6} ${mid - 6}, ${x - 2} ${mid} ` +
    `C${x + 6} ${mid + 6}, ${x + 2} ${y2}, ${x + w} ${y2 + 2}`;
  const el = ink(d, 2.2);
  el.setAttribute('transform', `rotate(${(rng(seed)() - 0.5) * 3} ${x} ${mid})`);
  return el;
}

export function arrow(from: XY, to: XY, seed: string, curve = 0): SVGGElement {
  const g = svgEl('g');
  const mx = (from.x + to.x) / 2 - (to.y - from.y) * curve;
  const my = (from.y + to.y) / 2 + (to.x - from.x) * curve;
  const shaft = curve === 0 ? wobbly([from, to], seed, 1.2) : `M${from.x} ${from.y} Q${mx} ${my} ${to.x} ${to.y}`;
  g.append(ink(shaft, 2.1));
  const ang = Math.atan2(to.y - my, to.x - mx);
  const head = 9;
  for (const s of [-1, 1]) {
    const a = ang + Math.PI + s * 0.5;
    g.append(ink(wobbly([to, { x: to.x + Math.cos(a) * head, y: to.y + Math.sin(a) * head }], `${seed}:h${s}`, 0.5), 2.1));
  }
  return g;
}

export function circle(cx: number, cy: number, rad: number, seed: string): SVGPathElement {
  const r = rng(seed + ':c');
  const pts: XY[] = [];
  const n = 14;
  for (let i = 0; i <= n + 1; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + 0.15;
    const rr = rad + (r() - 0.5) * 2.5;
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
  }
  return ink(wobbly(pts, seed, 0.6, 8), 2);
}
