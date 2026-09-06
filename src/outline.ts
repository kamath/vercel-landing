// Expand stroke skeletons into filled outlines with a round fine-liner nib.

import * as clipperLib from 'js-angusj-clipper';
import { bounds, fitContour, polygonArea, sampleStroke, type Contour, type Pt, type Stroke } from './geometry.js';

const SCALE = 16; // clipper works on integers; sub-unit precision for the offsets

export type Clipper = clipperLib.ClipperLibWrapper;

export async function loadClipper(): Promise<Clipper> {
  return clipperLib.loadNativeClipperLibInstanceAsync(clipperLib.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback);
}

export interface Outline {
  /** Closed contours, outer contours counter-clockwise, holes clockwise. */
  contours: Contour[];
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Stroke skeletons -> outline contours (cubic Béziers).
 * `slant` is the horizontal shear (tan of the lean angle) applied before stroking so the nib stays round.
 */
export function strokesToOutline(clipper: Clipper, strokes: Stroke[], penWidth: number, slant: number): Outline {
  if (strokes.length === 0) return { contours: [], bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };

  const offsetInputs: clipperLib.OffsetInput[] = strokes.map((st) => {
    const pts = sampleStroke(st, 3).map((p) => ({
      x: Math.round((p.x + p.y * slant) * SCALE),
      y: Math.round(p.y * SCALE),
    }));
    return {
      data: pts,
      joinType: clipperLib.JoinType.Round,
      endType: st.closed ? clipperLib.EndType.ClosedLine : clipperLib.EndType.OpenRound,
    };
  });

  const stroked = clipper.offsetToPaths({
    delta: (penWidth / 2) * SCALE,
    arcTolerance: 0.15 * SCALE,
    offsetInputs,
  });
  if (!stroked) throw new Error('offset failed');

  const merged = clipper.clipToPaths({
    clipType: clipperLib.ClipType.Union,
    subjectInputs: [{ data: stroked, closed: true }],
    subjectFillType: clipperLib.PolyFillType.NonZero,
  });
  if (!merged) throw new Error('union failed');

  const polygons: Pt[][] = merged
    .map((poly) => poly.map((p) => ({ x: p.x / SCALE, y: p.y / SCALE })))
    .filter((poly) => poly.length >= 3 && Math.abs(polygonArea(poly)) > 4);

  const contours = polygons.map((poly) => fitContour(poly, 1.2, 1.0));
  return { contours, bbox: bounds(polygons) };
}

export function translateContour(c: Contour, dx: number, dy: number): Contour {
  const mv = (p: Pt): Pt => ({ x: Math.round((p.x + dx) * 10) / 10, y: Math.round((p.y + dy) * 10) / 10 });
  return {
    start: mv(c.start),
    segs: c.segs.map((s) => (s.kind === 'line' ? { kind: 'line', to: mv(s.to) } : { kind: 'curve', c1: mv(s.c1), c2: mv(s.c2), to: mv(s.to) })),
  };
}
