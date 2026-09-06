// Notebook page: every note is laid out with Pretext (exact line breaks and widths) and rendered as SVG text,
// so strikes, underlines, boxes, and braces can be drawn from the measured geometry. Everything snaps to the
// paper grid: one text line per cell, left edges on vertical rules, baselines on horizontal rules.

import { layoutWithLines, measureNaturalWidth, prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext';
import { rng } from '../variants.js';
import { arrow, box, brace, ink, strike, svgEl, underline, wobbly, type XY } from './doodle.js';
import { notes, type Figure, type Note, type NoteItem } from './notes.js';

const FAMILY = '"Notebook Hand"';
const PAD = 8; // room around each block for doodles that overshoot the text
const GUTTER_COLS = 1; // blank cells kept to the right of a block
const GUTTER_ROWS = 1; // blank lines kept below a block

function gridSize(width: number): number {
  return width < 640 ? 26 : 30;
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
}

class NoteView {
  readonly el: HTMLElement;
  private readonly svg = svgEl('svg');
  private runs: Run[] = [];
  private grid = 0;
  private width = -1;
  private readonly scale: number;
  private readonly stretch: number;
  /** Block size in grid cells, set by layout(). */
  cols = 0;
  rows = 0;

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

  /** One-time measurement per grid size; layout() is then pure arithmetic. */
  prepare(grid: number): void {
    if (grid === this.grid) return;
    this.grid = grid;
    const base = grid * 0.78 * this.scale;
    this.runs = this.note.items.map((item) => {
      const s = Math.round(base * (item.size ?? 1) * 10) / 10;
      return { item, prepared: prepareWithSegments(item.text, fontOf(s)), size: s };
    });
    this.width = -1;
  }

  layout(available: number): void {
    const grid = this.grid;
    const size = grid * 0.78 * this.scale;
    const maxW = Math.max(3 * grid, Math.min(available - PAD * 2, (this.note.em ?? 16) * size * this.stretch));
    if (maxW === this.width) return;
    this.width = maxW;

    const svg = this.svg;
    svg.replaceChildren();
    if (this.note.figure) {
      const { w, h } = drawFigure(svg, this.note.figure, maxW, grid, this.note.id);
      this.frame(w, Math.ceil(h / grid) * grid);
      return;
    }

    const doodles = svgEl('g', { class: 'doodles' });
    let y = 0; // top of the current line, always a multiple of `grid`
    let right = 0;
    const tops: number[] = [];
    const bottoms: number[] = [];

    this.runs.forEach((run, idx) => {
      const indent = (run.item.indent ?? 0) * grid;
      const lh = grid * Math.max(1, Math.ceil((run.item.size ?? 1) - 0.3));
      // Small safety factor: the font's contextual alternates carry per-variant side bearings,
      // so a word measured in isolation can differ slightly from the same word in running text.
      const { lines } = layoutWithLines(run.prepared, Math.max(40, maxW - indent) * 0.96, lh);
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
          if (piece.href) {
            const a = svgEl('a', { href: piece.href, target: '_blank', rel: 'noopener' });
            a.append(span);
            text.append(a);
            const w = labelWidth(piece.str, run.size);
            doodles.append(underline(x, x + w, baseline + run.size * 0.16, `${seed}:${piece.str}`));
            x += w;
          } else {
            text.append(span);
            x += labelWidth(piece.str, run.size);
          }
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

// ----------------------------------------------------------------------------- figures

function labelWidth(text: string, size: number): number {
  // pre-wrap keeps leading and trailing spaces, which matter when measuring the prefix before an inline link.
  return measureNaturalWidth(prepareWithSegments(text, fontOf(size), { whiteSpace: 'pre-wrap' }));
}

function drawFigure(svg: SVGSVGElement, fig: Figure, w: number, grid: number, seed: string): { w: number; h: number } {
  const size = grid * 0.78;

  if (fig.kind === 'arc') {
    const h = w * 0.5;
    const from: XY = { x: w * 0.06, y: h * 0.78 };
    const to: XY = { x: w * 0.94, y: h * 0.76 };
    const ctrl: XY = { x: w * 0.5, y: -h * 0.1 };
    const path = ink(`M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`, 2);
    path.setAttribute('stroke-dasharray', '7 8');
    svg.append(path);
    const s = size * 0.55;
    // One plane each way, riding the arc, the return flight a lane below.
    const plane = (t: number, reverse: boolean) => {
      const q = (a: number, b: number, c: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
      const dx = 2 * (1 - t) * (ctrl.x - from.x) + 2 * t * (to.x - ctrl.x);
      const dy = 2 * (1 - t) * (ctrl.y - from.y) + 2 * t * (to.y - ctrl.y);
      const len = Math.hypot(dx, dy) || 1;
      const lane = reverse ? size * 0.75 : 0;
      const px = q(from.x, ctrl.x, to.x) - (dy / len) * lane;
      const py = q(from.y, ctrl.y, to.y) + (dx / len) * lane;
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI + (reverse ? 180 : 0);
      const el = ink(
        wobbly(
          [
            { x: -s, y: 0 }, { x: s * 0.9, y: 0 }, { x: s * 0.2, y: -s * 0.75 }, { x: -s * 0.2, y: -s * 0.75 }, { x: -s * 0.05, y: 0 },
            { x: -s * 0.2, y: s * 0.75 }, { x: s * 0.2, y: s * 0.75 }, { x: s * 0.9, y: 0 },
          ],
          `${seed}:plane${reverse ? 'r' : ''}`,
          0.5,
          6,
        ),
        2,
      );
      el.setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      return el;
    };
    svg.append(plane(0.4, false), plane(0.62, true));
    svg.append(textEl(from.x - size * 0.3, from.y + size * 0.95, size * 0.85, fig.from));
    const toW = labelWidth(fig.to, size * 0.85);
    svg.append(textEl(to.x - toW + size * 0.3, to.y + size * 0.95, size * 0.85, fig.to));
    return { w, h: from.y + size * 1.05 };
  }

  if (fig.kind === 'boxes') {
    const s = size * 0.95;
    const padX = s * 0.5;
    const boxH = grid * 1.4;
    const aW = labelWidth(fig.a, s) + padX * 2;
    const bW = labelWidth(fig.b, s) + padX * 2;
    const lw = labelWidth(fig.label, s * 0.8);
    const gap = Math.max(s * 3, lw + s * 1.2, w - aW - bW);
    const y0 = grid * 0.3;
    svg.append(box(0, y0, aW, boxH, `${seed}:a`));
    svg.append(textEl(padX, y0 + boxH * 0.72, s, fig.a));
    const bx = aW + gap;
    svg.append(box(bx, y0 + 3, bW, boxH, `${seed}:b`));
    svg.append(textEl(bx + padX, y0 + boxH * 0.72 + 3, s, fig.b));
    svg.append(arrow({ x: aW + 8, y: y0 + boxH * 0.5 }, { x: bx - 8, y: y0 + boxH * 0.52 }, `${seed}:arrow`, 0.08));
    svg.append(textEl(aW + gap / 2 - lw / 2, y0 + boxH * 0.5 - s * 0.35, s * 0.8, fig.label));
    return { w: aW + gap + bW, h: y0 + boxH + grid * 0.3 };
  }

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
 * Fill the page the way a hand fills paper: every section goes into the first free rectangle of grid cells
 * found scanning top-to-bottom, left-to-right, so short notes slide into gaps beside taller ones.
 */
function pack(views: NoteView[], cols: number): number {
  const stride = cols + 1;
  let rows = 128;
  let grid = new Uint8Array(cols * rows);
  // Summed-area table over the occupancy grid, so "is this rectangle free" is O(1).
  // It is kept incrementally: placing a section only dirties rows at and below it.
  let t = new Uint32Array(stride * (rows + 1));
  let validRows = 0;
  const extend = (upTo: number) => {
    for (let y = validRows + 1; y <= upTo; y++) {
      const row = y * stride;
      const prev = (y - 1) * stride;
      const g = (y - 1) * cols;
      let acc = 0;
      for (let x = 1; x <= cols; x++) {
        acc += grid[g + x - 1];
        t[row + x] = acc + t[prev + x];
      }
    }
    validRows = Math.max(validRows, upTo);
  };
  let bottom = 0;

  for (const v of views) {
    const wc = Math.min(cols, v.cols);
    const hc = v.rows;
    if (bottom + hc + 1 > rows) {
      const nextRows = rows * 2;
      const g2 = new Uint8Array(cols * nextRows);
      g2.set(grid);
      grid = g2;
      const t2 = new Uint32Array(stride * (nextRows + 1));
      t2.set(t);
      t = t2;
      rows = nextRows;
    }
    extend(bottom + hc);
    let px = 0;
    let py = bottom;
    outer: for (let y = 0; y < bottom; y++) {
      const top = y * stride;
      const bot = (y + hc) * stride;
      for (let x = 0; x + wc <= cols; x++) {
        if (t[bot + x + wc] - t[top + x + wc] - t[bot + x] + t[top + x] === 0) {
          px = x;
          py = y;
          break outer;
        }
      }
    }
    for (let y = py; y < py + hc; y++) grid.fill(1, y * cols + px, y * cols + px + wc);
    validRows = Math.min(validRows, py);
    v.el.dataset.cell = `${px},${py}`;
    bottom = Math.max(bottom, py + hc);
  }
  return bottom;
}

async function main(): Promise<void> {
  await Promise.all([document.fonts.load(fontOf(24)), document.fonts.load(fontOf(20))]);
  const page = document.getElementById('page')!;
  const views = notes.map((n) => new NoteView(n));
  for (const v of views) page.append(v.el);

  const timings: { width: number; text: number; pack: number }[] = [];
  const doLayout = () => {
    const width = page.clientWidth;
    const grid = gridSize(width);
    const margin = grid; // one blank cell of paper around the writing
    const cols = Math.max(4, Math.floor((width - margin * 2) / grid));
    page.style.setProperty('--cell', `${grid}px`);
    page.style.setProperty('--origin', `${margin}px`);

    const t0 = performance.now();
    for (const v of views) {
      v.prepare(grid);
      v.layout(cols * grid);
    }
    const t1 = performance.now();
    const rows = pack(views, cols);
    for (const v of views) {
      const [cx, cy] = v.el.dataset.cell!.split(',').map(Number);
      // The SVG's viewBox starts PAD before the text origin, so back the element up by PAD to land on the rule.
      v.el.style.left = `${margin + cx * grid - PAD}px`;
      v.el.style.top = `${margin + cy * grid - PAD}px`;
    }
    page.style.height = `${(rows + 2) * grid + margin}px`;
    const t2 = performance.now();
    timings.push({ width, text: Math.round((t1 - t0) * 100) / 100, pack: Math.round((t2 - t1) * 100) / 100 });
    if (timings.length > 20) timings.shift();
  };
  let pending = 0;
  const relayout = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(doLayout);
  };
  new ResizeObserver(relayout).observe(page);
  relayout();
  // Debug hook: window.__notes.timings shows how long the last layouts took.
  (window as unknown as { __notes: unknown }).__notes = { relayout: doLayout, timings };
}

void main();
