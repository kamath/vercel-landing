// Notebook page: every note is laid out with Pretext (exact line breaks and widths) and rendered as SVG text,
// so strikes, underlines, boxes, and braces can be drawn from the measured geometry. Everything snaps to the
// paper grid: one text line per cell, left edges on vertical rules, baselines on horizontal rules.

import {
  layoutWithLines,
  measureLineStats,
  measureNaturalWidth,
  prepareWithSegments,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import { rng } from '../variants.js';
import { box, brace, ink, strike, svgEl, underline, wobbly, type XY } from './doodle.js';
import { drawFlight } from './flight.js';
import { notes, type Figure, type Note, type NoteItem } from './notes.js';

const FAMILY = '"Notebook Hand"';
const PAD = 8; // room around each block for doodles that overshoot the text
const GUTTER_COLS = 1; // blank cells kept to the right of a block
const GUTTER_ROWS = 1; // blank lines kept below a block

function gridSize(width: number): number {
  return width < 640 ? 26 : width < 1100 ? 30 : 34;
}

function fontOf(px: number): string {
  return `${px}px ${FAMILY}`;
}

function textEl(x: number, y: number, size: number, content: string): SVGTextElement {
  const t = svgEl('text', { x, y, 'font-family': FAMILY, 'font-size': size });
  t.textContent = content;
  return t;
}

interface Run {
  item: NoteItem;
  prepared: PreparedTextWithSegments;
  size: number;
  /** Cells per line and indent, fixed per grid size. */
  lh: number;
  indent: number;
  /** Natural single-line width, only for nowrap items. */
  natural?: number;
}

interface Cells {
  cols: number;
  rows: number;
}

class NoteView {
  readonly el: HTMLElement;
  private readonly svg = svgEl('svg');
  private runs: Run[] = [];
  private grid = 0;
  private prepKey = '';
  private width = -1;
  /** Narrowest width that keeps every nowrap item on one line. */
  private minWidth = 0;
  private readonly scale: number;
  private readonly stretch: number;
  /** Block size in grid cells, set by layout(). */
  cols = 0;
  rows = 0;
  /** Cancels a running figure animation before the figure is redrawn. */
  private stopAnimation: (() => void) | null = null;

  constructor(readonly note: Note) {
    const r = rng(`scatter:${note.id}`);
    this.el = document.createElement('article');
    this.el.className = 'note';
    // Stay on the grid: only a hair of rotation and offset per section.
    this.el.style.setProperty('--rot', `${((r() - 0.5) * 1.4).toFixed(2)}deg`);
    this.el.style.setProperty('--dx', `${((r() - 0.5) * 3).toFixed(1)}px`);
    this.el.style.setProperty('--dy', `${((r() - 0.5) * 2).toFixed(1)}px`);
    this.scale = 0.95 + r() * 0.1; // each section written at a slightly different moment
    this.stretch = 0.85 + r() * 0.35; // how much of its preferred width it takes today
    this.el.append(this.svg);
  }

  /** One-time measurement per grid size; everything after is pure arithmetic until the DOM is written. */
  prepare(grid: number, available: number): void {
    const hasNowrap = this.note.items.some((i) => i.nowrap);
    const key = hasNowrap ? `${grid}:${available}` : String(grid);
    if (key === this.prepKey) return;
    this.prepKey = key;
    this.grid = grid;
    const base = grid * 0.78 * this.scale;
    this.minWidth = 0;
    this.runs = this.note.items.map((item) => {
      let s = Math.round(base * (item.size ?? 1) * 10) / 10;
      const indent = (item.indent ?? 0) * grid;
      let prepared = prepareWithSegments(item.text, fontOf(s));
      let natural: number | undefined;
      if (item.nowrap) {
        natural = measureNaturalWidth(prepared);
        const limit = available - indent - PAD * 2 - 4;
        if (natural > limit) {
          // Too wide for the paper: shrink this line rather than break it.
          s = Math.floor(s * (limit / natural) * 10) / 10;
          prepared = prepareWithSegments(item.text, fontOf(s));
          natural = measureNaturalWidth(prepared);
        }
        this.minWidth = Math.max(this.minWidth, indent + natural + 2);
      }
      return { item, prepared, size: s, lh: grid * Math.max(1, Math.ceil((item.size ?? 1) - 0.3)), indent, natural };
    });
    this.width = -1;
  }

  /** The width this section would like, given the paper width. */
  preferredWidth(available: number): number {
    const size = this.grid * 0.78 * this.scale;
    return Math.max(3 * this.grid, this.minWidth, Math.min(available - PAD * 2, (this.note.em ?? 16) * size * this.stretch));
  }

  /** Narrowest width this section may be squeezed to. */
  narrowest(pref: number): number {
    if (this.note.figure) return pref; // drawings keep their size
    return Math.max(4 * this.grid, this.minWidth, pref * 0.7);
  }

  /** Size in grid cells at a given width, without touching the DOM. */
  measure(maxW: number): Cells {
    const grid = this.grid;
    if (this.note.figure) {
      const { w, h } = figureSize(this.note.figure, maxW, grid);
      return { cols: Math.ceil(w / grid) + GUTTER_COLS, rows: Math.ceil(h / grid) + GUTTER_ROWS };
    }
    let y = 0;
    let right = 0;
    for (const run of this.runs) {
      const stats = measureLineStats(run.prepared, run.natural !== undefined ? run.natural + 2 : lineWidth(maxW, run.indent));
      y += stats.lineCount * run.lh + (run.item.gap ?? 0) * grid;
      right = Math.max(right, run.indent + stats.maxLineWidth);
    }
    return { cols: Math.ceil(right / grid) + GUTTER_COLS, rows: Math.round(y / grid) + GUTTER_ROWS };
  }

  layout(maxW: number): void {
    if (maxW === this.width) return;
    this.width = maxW;
    const grid = this.grid;

    const svg = this.svg;
    svg.replaceChildren();
    this.stopAnimation?.();
    this.stopAnimation = null;
    if (this.note.figure) {
      const fig = this.note.figure;
      const { w, h } =
        fig.kind === 'arc'
          ? (() => {
              const scene = drawFlight(svg, maxW, grid, this.note.id, { from: fig.from, to: fig.to }, textEl, labelWidth);
              this.stopAnimation = scene.stop;
              return scene;
            })()
          : drawFigure(svg, fig, maxW, grid, this.note.id);
      this.frame(w, Math.ceil(h / grid) * grid);
      return;
    }

    const doodles = svgEl('g', { class: 'doodles' });
    let y = 0; // top of the current line, always a multiple of `grid`
    let right = 0;
    const tops: number[] = [];
    const bottoms: number[] = [];

    this.runs.forEach((run, idx) => {
      const { indent, lh } = run;
      const { lines } = layoutWithLines(run.prepared, run.natural !== undefined ? run.natural + 2 : lineWidth(maxW, indent), lh);
      tops.push(y);
      const text = svgEl('text', { 'font-family': FAMILY, 'font-size': run.size });
      lines.forEach((line, i) => {
        // Letters sit on the horizontal rule: the baseline is the bottom of the cell, nudged up a touch.
        const baseline = y + lh * (i + 1) - grid * 0.12;
        const seed = `${this.note.id}:${idx}:${i}`;
        // Split the line around any inline links so only the linked words are clickable and underlined.
        let cursor = 0;
        let x = indent;
        const pieces: { str: string; href?: string }[] = [];
        for (const link of run.item.links ?? []) {
          const at = line.text.indexOf(link.text, cursor);
          if (at < 0) continue;
          if (at > cursor) pieces.push({ str: line.text.slice(cursor, at) });
          pieces.push({ str: link.text, href: link.href });
          cursor = at + link.text.length;
        }
        if (cursor < line.text.length) pieces.push({ str: line.text.slice(cursor) });
        for (const piece of pieces) {
          const span = svgEl('tspan', pieces[0] === piece ? { x, y: baseline } : {});
          span.textContent = piece.str;
          const w = labelWidth(piece.str, run.size);
          if (piece.href) {
            const a = svgEl('a', { href: piece.href, target: '_blank', rel: 'noopener' });
            a.append(span);
            text.append(a);
            doodles.append(underline(x, x + w, baseline + run.size * 0.16, `${seed}:${piece.str}`));
          } else {
            text.append(span);
          }
          x += w;
        }
        right = Math.max(right, indent + line.width);
        if (run.item.strike) doodles.append(strike(indent, indent + line.width, baseline - run.size * 0.22, seed));
        if (run.item.underline || run.item.href) doodles.append(underline(indent, indent + line.width, baseline + run.size * 0.16, seed));
      });
      if (run.item.href) {
        const a = svgEl('a', { href: run.item.href, target: '_blank', rel: 'noopener' });
        a.append(text);
        svg.append(a);
      } else {
        svg.append(text);
      }
      y += lines.length * lh;
      bottoms.push(y);
      y += (run.item.gap ?? 0) * grid;
    });

    if (this.note.brace) {
      const [a, b] = this.note.brace;
      doodles.append(brace(grid * 0.55, tops[a] + 4, bottoms[b] - 2, `${this.note.id}:brace`));
    }
    if (this.note.boxed) doodles.append(box(-8, 2, right + 16, y + 2, `${this.note.id}:box`));
    svg.append(doodles);
    this.frame(right, y);
  }

  private frame(w: number, h: number): void {
    const W = Math.ceil(w + PAD * 2);
    const H = Math.ceil(h + PAD * 2);
    this.svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${W} ${H}`);
    this.svg.setAttribute('width', String(W));
    this.svg.setAttribute('height', String(H));
    this.cols = Math.ceil(w / this.grid) + GUTTER_COLS;
    this.rows = Math.round(h / this.grid) + GUTTER_ROWS;
  }
}

/**
 * Usable line width. The small safety factor covers the font's contextual alternates, which carry
 * per-variant side bearings, so a word measured alone can differ slightly from the same word in running text.
 */
function lineWidth(maxW: number, indent: number): number {
  return Math.max(40, maxW - indent) * 0.96;
}

// ----------------------------------------------------------------------------- figures

function labelWidth(text: string, size: number): number {
  // pre-wrap keeps leading and trailing spaces, which matter when measuring the prefix before an inline link.
  return measureNaturalWidth(prepareWithSegments(text, fontOf(size), { whiteSpace: 'pre-wrap' }));
}

function figureSize(fig: Figure, w: number, grid: number): { w: number; h: number } {
  const size = grid * 0.78;
  if (fig.kind === 'arc') return { w, h: w * 0.5 * 0.78 + size * 1.05 };
  const h = grid * 3;
  return { w: Math.max(w, h * 0.7), h };
}

function drawFigure(svg: SVGSVGElement, fig: Exclude<Figure, { kind: 'arc' }>, w: number, grid: number, seed: string): { w: number; h: number } {

  // rocket: a small doodle, three grid rows tall.
  const h = grid * 3;
  const cx = w / 2;
  const body = wobbly(
    [
      { x: cx, y: 4 }, { x: cx + h * 0.16, y: h * 0.32 }, { x: cx + h * 0.16, y: h * 0.72 }, { x: cx - h * 0.16, y: h * 0.72 },
      { x: cx - h * 0.16, y: h * 0.32 }, { x: cx, y: 4 },
    ],
    `${seed}:body`,
    0.7,
    8,
  );
  svg.append(ink(body, 2));
  const fin = (dir: number) =>
    ink(wobbly([{ x: cx + dir * h * 0.16, y: h * 0.52 }, { x: cx + dir * h * 0.32, y: h * 0.8 }, { x: cx + dir * h * 0.16, y: h * 0.72 }], `${seed}:fin${dir}`, 0.6, 8), 2);
  svg.append(fin(1), fin(-1));
  const porthole = ink(wobbly([{ x: cx - 4, y: h * 0.4 }, { x: cx + 4, y: h * 0.36 }, { x: cx + 4, y: h * 0.46 }, { x: cx - 4, y: h * 0.47 }, { x: cx - 4, y: h * 0.4 }], `${seed}:win`, 0.4, 5), 1.8);
  svg.append(porthole);
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * h * 0.09;
    svg.append(ink(wobbly([{ x, y: h * 0.76 }, { x: x + (i - 1) * 3, y: h * (0.9 + (i === 1 ? 0.08 : 0)) }], `${seed}:fl${i}`, 0.8, 6), 2));
  }
  return { w: Math.max(w, h * 0.7), h };
}

// ----------------------------------------------------------------------------- page packing

/**
 * Occupancy of the page in grid cells, with a summed-area table so "is this rectangle free" is O(1).
 * The table is kept incrementally: placing a section only dirties rows at and below it.
 */
class Paper {
  private rows = 128;
  private grid: Uint8Array;
  private t: Uint32Array;
  private validRows = 0;
  bottom = 0;
  private readonly stride: number;

  constructor(readonly cols: number) {
    this.stride = cols + 1;
    this.grid = new Uint8Array(cols * this.rows);
    this.t = new Uint32Array(this.stride * (this.rows + 1));
  }

  private ensure(rowsNeeded: number): void {
    if (rowsNeeded <= this.rows) return;
    const next = Math.max(rowsNeeded, this.rows * 2);
    const g2 = new Uint8Array(this.cols * next);
    g2.set(this.grid);
    this.grid = g2;
    const t2 = new Uint32Array(this.stride * (next + 1));
    t2.set(this.t);
    this.t = t2;
    this.rows = next;
  }

  private extend(upTo: number): void {
    const { cols, stride, grid, t } = this;
    for (let y = this.validRows + 1; y <= upTo; y++) {
      const row = y * stride;
      const prev = (y - 1) * stride;
      const g = (y - 1) * cols;
      let acc = 0;
      for (let x = 1; x <= cols; x++) {
        acc += grid[g + x - 1];
        t[row + x] = acc + t[prev + x];
      }
    }
    this.validRows = Math.max(this.validRows, upTo);
  }

  /** First free spot scanning top-to-bottom, left-to-right. The row at the bottom is always free. */
  find(wc: number, hc: number): { x: number; y: number } {
    wc = Math.min(wc, this.cols);
    this.ensure(this.bottom + hc + 1);
    this.extend(this.bottom + hc);
    const { stride, t, cols } = this;
    for (let y = 0; y < this.bottom; y++) {
      const top = y * stride;
      const bot = (y + hc) * stride;
      for (let x = 0; x + wc <= cols; x++) {
        if (t[bot + x + wc] - t[top + x + wc] - t[bot + x] + t[top + x] === 0) return { x, y };
      }
    }
    return { x: 0, y: this.bottom };
  }

  place(x: number, y: number, wc: number, hc: number): void {
    wc = Math.min(wc, this.cols);
    this.ensure(y + hc + 1);
    for (let r = y; r < y + hc; r++) this.grid.fill(1, r * this.cols + x, r * this.cols + x + wc);
    this.validRows = Math.min(this.validRows, y);
    this.bottom = Math.max(this.bottom, y + hc);
  }
}

/**
 * Fill the page the way a hand fills paper. Each section tries its preferred width and a few narrower ones,
 * and takes whichever placement lands highest (then leftmost, then widest): a note happily squeezes into
 * the gap beside a wider neighbour instead of starting a new row below it.
 */
function pack(views: NoteView[], cols: number, grid: number): number {
  const paper = new Paper(cols);
  const available = cols * grid;
  for (const v of views) {
    const pref = v.preferredWidth(available);
    const minW = Math.min(pref, v.narrowest(pref)); // always at least one candidate
    let best: { x: number; y: number; w: number; cells: Cells } | null = null;
    for (let w = pref; w >= minW; w -= grid) {
      const cells = v.measure(w);
      const spot = paper.find(cells.cols, cells.rows);
      if (!best || spot.y < best.y || (spot.y === best.y && spot.x < best.x)) best = { ...spot, w, cells };
      if (spot.y === 0 && spot.x === 0) break;
    }
    const { x, y, w } = best!;
    v.layout(w);
    // The rendered size normally equals the measured one; if rounding ever disagrees, re-seat it safely.
    let spot = { x, y };
    if (v.cols !== best!.cells.cols || v.rows !== best!.cells.rows) spot = paper.find(v.cols, v.rows);
    paper.place(spot.x, spot.y, v.cols, v.rows);
    v.el.dataset.cell = `${spot.x},${spot.y}`;
  }
  return paper.bottom;
}

async function main(): Promise<void> {
  await Promise.all([document.fonts.load(fontOf(24)), document.fonts.load(fontOf(20))]);
  const page = document.getElementById('page')!;
  const views = notes.map((n) => new NoteView(n));
  for (const v of views) page.append(v.el);

  const timings: { width: number; ms: number }[] = [];
  const doLayout = () => {
    const width = page.clientWidth;
    const grid = gridSize(width);
    const margin = grid; // one blank cell of paper around the writing
    const cols = Math.max(4, Math.floor((width - margin * 2) / grid));
    page.style.setProperty('--cell', `${grid}px`);
    page.style.setProperty('--origin', `${margin}px`);

    const t0 = performance.now();
    for (const v of views) v.prepare(grid, cols * grid);
    const rows = pack(views, cols, grid);
    for (const v of views) {
      const [cx, cy] = v.el.dataset.cell!.split(',').map(Number);
      // The SVG's viewBox starts PAD before the text origin, so back the element up by PAD to land on the rule.
      v.el.style.left = `${margin + cx * grid - PAD}px`;
      v.el.style.top = `${margin + cy * grid - PAD}px`;
    }
    page.style.height = `${(rows + 2) * grid + margin}px`;
    timings.push({ width, ms: Math.round((performance.now() - t0) * 100) / 100 });
    if (timings.length > 20) timings.shift();
  };
  let pending = 0;
  const relayout = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(doLayout);
  };
  new ResizeObserver(relayout).observe(page);
  doLayout(); // synchronously, so a background tab or prerender still gets a laid-out page
  // Debug hook: window.__notes.timings shows how long the last layouts took.
  (window as unknown as { __notes: unknown }).__notes = { relayout: doLayout, timings };
}

void main();
