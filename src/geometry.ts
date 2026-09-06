// Geometry helpers: point types, Catmull-Rom sampling, transforms, simplification.

export interface Pt {
  x: number;
  y: number;
  /** Corner point: the spline breaks tangent continuity here. */
  c?: boolean;
}

export interface Stroke {
  pts: Pt[];
  closed?: boolean;
}

export const P = (x: number, y: number): Pt => ({ x, y });
export const C = (x: number, y: number): Pt => ({ x, y, c: true });

/** Open smooth stroke through the given points. */
export const S = (...pts: Pt[]): Stroke => ({ pts });
/** Closed smooth loop through the given points. */
export const O = (...pts: Pt[]): Stroke => ({ pts, closed: true });

/** Shorthand: build a stroke from a flat number list [x0,y0,x1,y1,...]. */
export function s(...nums: number[]): Stroke {
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  return { pts };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Sample a centripetal Catmull-Rom spline through `pts`.
 * Corner points split the curve into independent smooth segments.
 * Returns a dense polyline (roughly one sample per `step` units).
 */
export function sampleStroke(stroke: Stroke, step = 4): Pt[] {
  const pts = stroke.pts;
  if (pts.length === 1) return [{ ...pts[0] }];
  if (pts.length === 2) return [{ ...pts[0] }, { ...pts[1] }];

  if (stroke.closed) {
    const n = pts.length;
    const out: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      out.push(...segment(p0, p1, p2, p3, step, false));
    }
    return out;
  }

  // Split at corners into runs; each run is a smooth spline.
  const runs: Pt[][] = [];
  let cur: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    cur.push(pts[i]);
    if (pts[i].c && i < pts.length - 1) {
      runs.push(cur);
      cur = [pts[i]];
    }
  }
  runs.push(cur);

  const out: Pt[] = [];
  for (const run of runs) {
    if (run.length === 2) {
      if (out.length === 0) out.push({ ...run[0] });
      out.push({ ...run[1] });
      continue;
    }
    for (let i = 0; i < run.length - 1; i++) {
      const p0 = i === 0 ? reflect(run[1], run[0]) : run[i - 1];
      const p1 = run[i];
      const p2 = run[i + 1];
      const p3 = i + 2 < run.length ? run[i + 2] : reflect(run[i], run[i + 1]);
      const seg = segment(p0, p1, p2, p3, step, i === run.length - 2);
      if (out.length > 0 && i === 0) seg.shift();
      out.push(...seg);
    }
  }
  return out;
}

function reflect(a: Pt, b: Pt): Pt {
  return { x: 2 * b.x - a.x, y: 2 * b.y - a.y };
}

/** Centripetal Catmull-Rom segment between p1 and p2. */
function segment(p0: Pt, p1: Pt, p2: Pt, p3: Pt, step: number, includeEnd: boolean): Pt[] {
  const alpha = 0.5;
  const t0 = 0;
  const t1 = t0 + Math.max(dist(p0, p1), 1e-3) ** alpha;
  const t2 = t1 + Math.max(dist(p1, p2), 1e-3) ** alpha;
  const t3 = t2 + Math.max(dist(p2, p3), 1e-3) ** alpha;
  const n = Math.max(2, Math.ceil(dist(p1, p2) / step));
  const out: Pt[] = [];
  const last = includeEnd ? n : n - 1;
  for (let i = 0; i <= last; i++) {
    const t = t1 + ((t2 - t1) * i) / n;
    const a1 = lerp(p0, p1, (t1 - t) / (t1 - t0), (t - t0) / (t1 - t0));
    const a2 = lerp(p1, p2, (t2 - t) / (t2 - t1), (t - t1) / (t2 - t1));
    const a3 = lerp(p2, p3, (t3 - t) / (t3 - t2), (t - t2) / (t3 - t2));
    const b1 = lerp(a1, a2, (t2 - t) / (t2 - t0), (t - t0) / (t2 - t0));
    const b2 = lerp(a2, a3, (t3 - t) / (t3 - t1), (t - t1) / (t3 - t1));
    const c = lerp(b1, b2, (t2 - t) / (t2 - t1), (t - t1) / (t2 - t1));
    out.push(c);
  }
  return out;
}

function lerp(a: Pt, b: Pt, wa: number, wb: number): Pt {
  return { x: a.x * wa + b.x * wb, y: a.y * wa + b.y * wb };
}

/** Ramer-Douglas-Peucker polyline simplification (closed polygon). */
export function simplifyPolygon(poly: Pt[], tolerance: number): Pt[] {
  if (poly.length < 4) return poly;
  // Rotate so that the first point is an extreme point (helps closed-shape RDP).
  let start = 0;
  for (let i = 1; i < poly.length; i++) if (poly[i].x < poly[start].x) start = i;
  const rotated = [...poly.slice(start), ...poly.slice(0, start)];
  // Find farthest point from start to split into two open chains.
  let far = 0;
  let farD = -1;
  for (let i = 1; i < rotated.length; i++) {
    const d = dist(rotated[0], rotated[i]);
    if (d > farD) {
      farD = d;
      far = i;
    }
  }
  const a = rdp(rotated.slice(0, far + 1), tolerance);
  const b = rdp(rotated.slice(far), tolerance);
  const result = [...a.slice(0, -1), ...b.slice(0, -1)];
  return result.length >= 3 ? result : poly;
}

function rdp(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];
  let idx = -1;
  let maxD = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > tol && idx > 0) {
    const left = rdp(pts.slice(0, idx + 1), tol);
    const right = rdp(pts.slice(idx), tol);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Signed polygon area (positive = counter-clockwise in y-up coordinates). */
export function polygonArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function bounds(polys: Pt[][]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of polys)
    for (const p of poly) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  return { minX, minY, maxX, maxY };
}

// ---------------------------------------------------------------------------
// Cubic Bézier fitting (Schneider, Graphics Gems 1990) for closed polygons.

export type PathSeg = { kind: 'line'; to: Pt } | { kind: 'curve'; c1: Pt; c2: Pt; to: Pt };
export interface Contour {
  start: Pt;
  segs: PathSeg[];
}

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const dotp = (a: Pt, b: Pt): number => a.x * b.x + a.y * b.y;
const norm = (a: Pt): Pt => {
  const l = Math.hypot(a.x, a.y);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};

function bezierPoint(b: Pt[], t: number): Pt {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const c = 3 * mt * mt * t;
  const d = 3 * mt * t * t;
  const e = t * t * t;
  return { x: a * b[0].x + c * b[1].x + d * b[2].x + e * b[3].x, y: a * b[0].y + c * b[1].y + d * b[2].y + e * b[3].y };
}

function chordLengthParameterize(pts: Pt[]): number[] {
  const u = [0];
  for (let i = 1; i < pts.length; i++) u.push(u[i - 1] + dist(pts[i], pts[i - 1]));
  const total = u[u.length - 1] || 1;
  return u.map((v) => v / total);
}

function generateBezier(pts: Pt[], u: number[], tHat1: Pt, tHat2: Pt): Pt[] {
  const first = pts[0];
  const last = pts[pts.length - 1];
  let c00 = 0;
  let c01 = 0;
  let c11 = 0;
  let x0 = 0;
  let x1 = 0;
  for (let i = 0; i < pts.length; i++) {
    const t = u[i];
    const mt = 1 - t;
    const b0 = mt * mt * mt;
    const b1 = 3 * t * mt * mt;
    const b2 = 3 * t * t * mt;
    const b3 = t * t * t;
    const a0 = mul(tHat1, b1);
    const a1 = mul(tHat2, b2);
    c00 += dotp(a0, a0);
    c01 += dotp(a0, a1);
    c11 += dotp(a1, a1);
    const tmp = sub(pts[i], add(mul(first, b0 + b1), mul(last, b2 + b3)));
    x0 += dotp(a0, tmp);
    x1 += dotp(a1, tmp);
  }
  const det = c00 * c11 - c01 * c01;
  let alphaL = det === 0 ? 0 : (x0 * c11 - x1 * c01) / det;
  let alphaR = det === 0 ? 0 : (c00 * x1 - c01 * x0) / det;
  const segLen = dist(first, last);
  const eps = 1e-6 * segLen;
  if (alphaL < eps || alphaR < eps || alphaL > segLen * 2 || alphaR > segLen * 2) {
    alphaL = alphaR = segLen / 3;
  }
  return [first, add(first, mul(tHat1, alphaL)), add(last, mul(tHat2, alphaR)), last];
}

function computeMaxError(pts: Pt[], bez: Pt[], u: number[]): { maxDist: number; split: number } {
  let maxDist = 0;
  let split = Math.floor(pts.length / 2);
  for (let i = 1; i < pts.length - 1; i++) {
    const d = sub(bezierPoint(bez, u[i]), pts[i]);
    const dd = dotp(d, d);
    if (dd > maxDist) {
      maxDist = dd;
      split = i;
    }
  }
  return { maxDist, split };
}

function reparameterize(pts: Pt[], u: number[], bez: Pt[]): number[] {
  return u.map((t, i) => {
    const q = bezierPoint(bez, t);
    const q1 = [sub(bez[1], bez[0]), sub(bez[2], bez[1]), sub(bez[3], bez[2])].map((v) => mul(v, 3));
    const q2 = [sub(q1[1], q1[0]), sub(q1[2], q1[1])].map((v) => mul(v, 2));
    const mt = 1 - t;
    const d1 = add(add(mul(q1[0], mt * mt), mul(q1[1], 2 * mt * t)), mul(q1[2], t * t));
    const d2 = add(mul(q2[0], mt), mul(q2[1], t));
    const diff = sub(q, pts[i]);
    const num = dotp(diff, d1);
    const den = dotp(d1, d1) + dotp(diff, d2);
    if (den === 0) return t;
    const nt = t - num / den;
    return Math.min(1, Math.max(0, nt));
  });
}

function fitCubicRun(pts: Pt[], tHat1: Pt, tHat2: Pt, tolSq: number, out: PathSeg[], depth = 0): void {
  if (pts.length === 2) {
    out.push({ kind: 'line', to: pts[1] });
    return;
  }
  let u = chordLengthParameterize(pts);
  let bez = generateBezier(pts, u, tHat1, tHat2);
  let err = computeMaxError(pts, bez, u);
  if (err.maxDist < tolSq) {
    out.push({ kind: 'curve', c1: bez[1], c2: bez[2], to: bez[3] });
    return;
  }
  if (err.maxDist < tolSq * 16) {
    for (let i = 0; i < 6; i++) {
      u = reparameterize(pts, u, bez);
      bez = generateBezier(pts, u, tHat1, tHat2);
      err = computeMaxError(pts, bez, u);
      if (err.maxDist < tolSq) {
        out.push({ kind: 'curve', c1: bez[1], c2: bez[2], to: bez[3] });
        return;
      }
    }
  }
  if (depth > 24) {
    out.push({ kind: 'curve', c1: bez[1], c2: bez[2], to: bez[3] });
    return;
  }
  const split = Math.min(Math.max(err.split, 1), pts.length - 2);
  const tCenter = norm(sub(pts[split - 1], pts[split + 1]));
  fitCubicRun(pts.slice(0, split + 1), tHat1, tCenter, tolSq, out, depth + 1);
  fitCubicRun(pts.slice(split), mul(tCenter, -1), tHat2, tolSq, out, depth + 1);
}

/** Fit a closed polygon with cubic Béziers, breaking at sharp corners. */
export function fitContour(poly: Pt[], tolerance: number, cornerAngle = 0.7): Contour {
  const n = poly.length;
  // Remove near-duplicate points.
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) if (pts.length === 0 || dist(pts[pts.length - 1], poly[i]) > 0.05) pts.push(poly[i]);
  while (pts.length > 1 && dist(pts[0], pts[pts.length - 1]) <= 0.05) pts.pop();
  const m = pts.length;
  if (m < 3) return { start: pts[0], segs: pts.slice(1).map((p) => ({ kind: 'line', to: p })) };

  const corners: number[] = [];
  for (let i = 0; i < m; i++) {
    const a = norm(sub(pts[i], pts[(i - 1 + m) % m]));
    const b = norm(sub(pts[(i + 1) % m], pts[i]));
    const turn = Math.acos(Math.max(-1, Math.min(1, dotp(a, b))));
    if (turn > cornerAngle) corners.push(i);
  }

  const tolSq = tolerance * tolerance;
  const segs: PathSeg[] = [];
  if (corners.length === 0) {
    const run = [...pts, pts[0]];
    const t1 = norm(sub(pts[1], pts[m - 1]));
    fitCubicRun(run, t1, mul(t1, -1), tolSq, segs);
    return { start: pts[0], segs };
  }

  const start = corners[0];
  for (let k = 0; k < corners.length; k++) {
    const from = corners[k];
    const to = corners[(k + 1) % corners.length];
    const run: Pt[] = [];
    let i = from;
    while (true) {
      run.push(pts[i]);
      if (i === to && run.length > 1) break;
      i = (i + 1) % m;
      if (i === from) {
        run.push(pts[from]);
        break;
      }
    }
    if (run.length < 2) continue;
    const t1 = norm(sub(run[1], run[0]));
    const t2 = norm(sub(run[run.length - 2], run[run.length - 1]));
    fitCubicRun(run, t1, t2, tolSq, segs);
  }
  return { start: pts[start], segs };
}
