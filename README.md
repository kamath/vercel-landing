# Notebook Hand

An OpenType (CFF) handwriting font built from the letterforms in Anirudh's notebook. Everything is TypeScript, run with pnpm.

## Output

- `dist/NotebookHand-Regular.otf` — the font. Install it like any OTF (double-click on macOS, or drop into `~/Library/Fonts`).
- `dist/NotebookHand-Specimen.svg` — a specimen rendered through the same substitution rules the font carries.
- `dist/preview.html` — loads the real OTF so a browser's shaper can be checked.

## How the variation works

- Every letter, digit, ligature, and the space has three variants (`a`, `a.alt1`, `a.alt2`). Some are drawn by hand in `src/glyphs.ts`; the rest are derived by a seeded, low-frequency warp (`src/variants.ts`) that also nudges pen width, slant, and side bearings.
- A `calt` (and `rlig`, for engines that skip `calt`) chained-context lookup cycles variants based on the two preceding glyphs, so a run of text moves through the variants with period 6 rather than repeating.
- `liga` joins `tt`, `th`, `ff`, `fi`, and `ll` into hand-drawn combinations (shared crossbars, and so on).
- `salt`, `ss01`, `ss02` expose the alternates for manual selection.

Outlines come from stroke skeletons (Catmull-Rom splines) expanded with a round nib via polygon offsetting, unioned, then fitted with cubic Béziers.

## Commands

```bash
pnpm install
pnpm build        # writes dist/
pnpm exec tsx src/check.ts   # parses the OTF back and lists features
pnpm typecheck
```

## Editing letterforms

Edit the point lists in `src/glyphs.ts`. Coordinates are upright font units (1000 per em): baseline 0, x-height 400, ascender 700, cap height 670, descender −220. The slant is applied at build time. `s(x0, y0, x1, y1, …)` is a smooth stroke through those points, `O(...)` a closed loop, and `C(x, y)` marks a corner.
