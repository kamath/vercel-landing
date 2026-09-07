# Anirudh's Notebook

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

## Homepage

`pnpm dev` serves `dist/index.html`: a personal landing page written the way the notebook is, in as few words as possible. Each section is measured and line-broken with [Pretext](http://pretextjs.dev/) (`prepareWithSegments` once, `layoutWithLines` on every resize) and rendered as SVG text, so the hand-drawn strikethroughs, underlines, boxes, and braces are placed from the measured line widths. A few SVG sketches and photos are mixed in: a photo is a note like any other, drawn as a tilted print on a white border, and the build measures every file in `src/site/public/imgs` so the layout knows each photo's shape before it loads. Sections are placed in order, each carrying on from where the last one stopped, so a photo listed between two sections lands between them on the page. Everything snaps to the paper grid: one text line per cell, left edges on the vertical rules, baselines on the horizontal ones. Sections fill free space with a first-fit packer over the grid (an incrementally maintained summed-area table makes each placement check O(1)); a full relayout is a few milliseconds and `window.__notes.timings` shows the numbers. Content lives in `src/site/notes.ts`. A click anywhere but on a link doodles there: one of the small sketches in `src/site/sketches.ts` (the rocket, the pointed S, a cube, an 8 gone over a few times), picked at random and drawn by a slightly different hand each time (its own tilt, size, pen, and proportions, so no two come out alike), is pinned to that cell, drawn stroke by stroke, and the packer lays the written sections out around it, so the page makes room instead of covering it; only the new note is measured, everything else keeps its rendering and slides to its new cell.
