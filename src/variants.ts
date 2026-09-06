// Deterministic per-variant warping so alternates look like the same hand on a different day.

import type { Pt, Stroke } from './geometry.js';

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG seeded from a string. */
export function rng(seed: string): () => number {
  let a = hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface WarpParams {
  rotate: number; // radians
  sx: number;
  sy: number;
  dy: number;
  shear: number;
  amp: number;
  phase: number[];
}

export function randomWarp(seed: string, strength = 1): WarpParams {
  const r = rng(seed);
  const u = () => (r() - 0.5) * 2;
  return {
    rotate: u() * 0.026 * strength, // about ±1.5 degrees
    sx: 1 + u() * 0.035 * strength,
    sy: 1 + u() * 0.03 * strength,
    dy: u() * 7 * strength,
    shear: u() * 0.025 * strength,
    amp: 7 * strength,
    phase: [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28],
  };
}

/** Low-frequency, smooth displacement field so strokes bend rather than wobble. */
function field(p: Pt, w: WarpParams): Pt {
  const k1 = (2 * Math.PI) / 520;
  const k2 = (2 * Math.PI) / 760;
  const dx = w.amp * (Math.sin(p.y * k1 + w.phase[0]) * 0.7 + Math.cos(p.x * k2 + w.phase[1]) * 0.5);
  const dy = w.amp * (Math.sin(p.x * k1 + w.phase[2]) * 0.6 + Math.cos(p.y * k2 + w.phase[3]) * 0.4);
  return { x: dx, y: dy };
}

export function warpStrokes(strokes: Stroke[], w: WarpParams): Stroke[] {
  // Centre of rotation: horizontal middle of the skeleton, at half the x-height.
  let minX = Infinity;
  let maxX = -Infinity;
  for (const st of strokes)
    for (const p of st.pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
  const cx = (minX + maxX) / 2;
  const cy = 200;
  const cos = Math.cos(w.rotate);
  const sin = Math.sin(w.rotate);

  return strokes.map((st) => ({
    closed: st.closed,
    pts: st.pts.map((p) => {
      const f = field(p, w);
      let x = (p.x - cx + f.x) * w.sx;
      let y = (p.y - cy + f.y) * w.sy;
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      x = rx + ry * w.shear + cx;
      y = ry + cy + w.dy;
      // Keep the baseline honest: things that sat on the baseline stay close to it.
      return { x, y, c: p.c };
    }),
  }));
}
