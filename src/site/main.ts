// Notebook page: every note is laid out with Pretext (exact line breaks and widths) and rendered as SVG text,
// so strikes, underlines, boxes, and braces can be drawn from the measured geometry.

import { layoutWithLines, measureNaturalWidth, prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext';
import { rng } from '../variants.js';
import { arrow, box, brace, circle, ink, strike, svgEl, underline, wobbly, type XY } from './doodle.js';
import { notes, type Note, type NoteItem } from './notes.js';

const FAMILY = '"Notebook Hand"';
const LINE = 1.42; // line-height multiplier
const PAD = 7; // room around each block for doodles that overshoot the text

function baseSize(): number {
  const w = window.innerWidth;
  return w < 640 ? 21 : w < 1100 ? 24 : 26;
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
  private size = 0;
  private width = -1;
  private scale = 1;
  w = 0;
  h = 0;
  readonly stretch: number;

  constructor(readonly note: Note) {
    const r = rng(`scatter:${note.id}`);
    this.el = document.createElement('article');
    this.el.className = 'note' + (note.wide ? ' wide' : '');
    this.el.style.setProperty('--rot', `${((r() - 0.5) * 4.6).toFixed(2)}deg`);
    this.el.style.setProperty('--dx', `${((r() - 0.5) * 16).toFixed(1)}px`);
    this.el.style.setProperty('--dy', `${((r() - 0.5) * 10).toFixed(1)}px`);
    this.el.style.setProperty('--mt', `${(r() * 14).toFixed(0)}px`);
    // Each section was written at a slightly different moment: vary its size a touch.
    this.scale = 0.93 + r() * 0.14;
    this.stretch = 0.85 + r() * 0.35; // how much of its preferred width this section takes today
    this.el.style.setProperty('--rot', `${((r() - 0.5) * 3.2).toFixed(2)}deg`);
    this.el.append(this.svg);
  }

  /** One-time measurement per font size; layout() is then pure arithmetic. */
  prepare(base: number): void {
    const size = Math.round(base * this.scale * 10) / 10;
    if (size === this.size) return;
    this.size = size;
    this.runs = this.note.items.map((item) => {
      const s = Math.round(size * (item.size ?? 1) * 10) / 10;
      return { item, prepared: prepareWithSegments(item.text, fontOf(s)), size: s };
    });
    this.width = -1;
  }

  layout(available: number): void {
    const size = this.size;
    const maxW = Math.max(60, Math.min(available - PAD * 2, (this.note.em ?? 16) * size * this.stretch));
    if (maxW === this.width) return;
    this.width = maxW;

    const svg = this.svg;
    svg.replaceChildren();
    if (this.note.figure) {
      const { w, h } = drawFigure(svg, this.note.figure, maxW, size, this.note.id);
      this.frame(w, h);
      return;
    }

    const doodles = svgEl('g', { class: 'doodles' });
    let y = 0;
    let right = 0;
    const tops: number[] = [];
    const bottoms: number[] = [];

    this.runs.forEach((run, idx) => {
      const indent = (run.item.indent ?? 0) * size;
      const lh = run.size * LINE;
      // Small safety factor: the font's contextual alternates carry per-variant side bearings,
      // so a word measured in isolation can differ slightly from the same word in running text.
      const { lines } = layoutWithLines(run.prepared, Math.max(40, maxW - indent) * 0.96, lh);
      tops.push(y);
      const text = svgEl('text', { 'font-family': FAMILY, 'font-size': run.size });
      lines.forEach((line, i) => {
        const baseline = y + lh * 0.74 + i * lh;
        const span = svgEl('tspan', { x: indent, y: baseline });
        span.textContent = line.text;
        text.append(span);
        right = Math.max(right, indent + line.width);
        const seed = `${this.note.id}:${idx}:${i}`;
        if (run.item.strike) doodles.append(strike(indent, indent + line.width, baseline - run.size * 0.2, seed));
        if (run.item.underline) doodles.append(underline(indent, indent + line.width, baseline + run.size * 0.16, seed));
      });
      svg.append(text);
      y += lines.length * lh;
      bottoms.push(y);
      y += (run.item.gap ?? 0) * size;
    });

    if (this.note.brace) {
      const [a, b] = this.note.brace;
      doodles.append(brace(-10, tops[a] + 4, bottoms[b] - 2, `${this.note.id}:brace`));
    }
    if (this.note.boxed) doodles.append(box(-9, -4, right + 18, y + 6, `${this.note.id}:box`));
    svg.append(doodles);
    this.frame(right, y);
  }

  private frame(w: number, h: number): void {
    const W = Math.ceil(w + PAD * 2);
    const H = Math.ceil(h + PAD * 2);
    this.svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${W} ${H}`);
    this.svg.setAttribute('width', String(W));
    this.svg.setAttribute('height', String(H));
    this.w = W;
    this.h = H;
  }
}

// ----------------------------------------------------------------------------- figures

function labelWidth(text: string, size: number): number {
  return measureNaturalWidth(prepareWithSegments(text, fontOf(size)));
}

function drawFigure(svg: SVGSVGElement, kind: NonNullable<Note['figure']>, w: number, size: number, seed: string): { w: number; h: number } {
  if (kind === 'flight') {
    const h = w * 0.55;
    const from: XY = { x: w * 0.06, y: h * 0.72 };
    const to: XY = { x: w * 0.94, y: h * 0.7 };
    const ctrl: XY = { x: w * 0.5, y: -h * 0.15 };
    const path = ink(`M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`, 2);
    path.setAttribute('stroke-dasharray', '7 8');
    svg.append(path);
    // Plane at 45% along the curve, rotated to the tangent.
    const t = 0.45;
    const q = (a: number, b: number, c: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
    const px = q(from.x, ctrl.x, to.x);
    const py = q(from.y, ctrl.y, to.y);
    const dx = 2 * (1 - t) * (ctrl.x - from.x) + 2 * t * (to.x - ctrl.x);
    const dy = 2 * (1 - t) * (ctrl.y - from.y) + 2 * t * (to.y - ctrl.y);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const s = size * 0.55;
    const plane = ink(
      wobbly(
        [
          { x: -s, y: 0 }, { x: s * 0.9, y: 0 }, { x: s * 0.2, y: -s * 0.75 }, { x: -s * 0.2, y: -s * 0.75 }, { x: -s * 0.05, y: 0 },
          { x: -s * 0.2, y: s * 0.75 }, { x: s * 0.2, y: s * 0.75 }, { x: s * 0.9, y: 0 },
        ],
        `${seed}:plane`,
        0.5,
        6,
      ),
      2,
    );
    plane.setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    svg.append(plane);
    svg.append(textEl(from.x - size * 0.4, from.y + size * 0.95, size * 0.85, 'NYC (EWR)'));
    const sfW = labelWidth('SF', size * 0.85);
    svg.append(textEl(to.x - sfW + size * 0.3, to.y + size * 0.95, size * 0.85, 'SF'));
    svg.append(textEl(w * 0.34, h * 0.98, size * 0.75, '4:14 to go'));
    return { w, h: h + size * 0.6 };
  }

  if (kind === 'client-server') {
    const s = size * 0.95;
    const padX = s * 0.5;
    const boxH = s * 1.5;
    const cW = labelWidth('client', s) + padX * 2;
    const sW = labelWidth('server', s) + padX * 2;
    const gap = Math.max(s * 2.2, w - cW - sW);
    const y0 = 0;
    svg.append(box(0, y0, cW, boxH, `${seed}:c`));
    svg.append(textEl(padX, y0 + boxH * 0.72, s, 'client'));
    const sx = cW + gap;
    svg.append(box(sx, y0 + 4, sW, boxH, `${seed}:s`));
    svg.append(textEl(sx + padX, y0 + boxH * 0.72 + 4, s, 'server'));
    svg.append(arrow({ x: cW + 8, y: y0 + boxH * 0.45 }, { x: sx - 8, y: y0 + boxH * 0.5 }, `${seed}:a1`));
    const y1 = boxH + s * 1.9;
    svg.append(textEl(0, y1, s, 'claude'));
    const clW = labelWidth('claude', s);
    svg.append(arrow({ x: clW + 12, y: y1 - s * 0.3 }, { x: clW + s * 3.6, y: y1 - s * 0.3 }, `${seed}:a2`, 0.12));
    svg.append(textEl(clW + s * 3.9, y1 + s * 0.15, s, 'browserbase $'));
    const y2 = y1 + s * 1.5;
    svg.append(textEl(0, y2, s, 'claude'));
    svg.append(arrow({ x: clW + 12, y: y2 - s * 0.3 }, { x: clW + s * 2.6, y: y2 - s * 0.35 }, `${seed}:a3`));
    return { w: Math.max(cW + gap + sW, clW + s * 3.9 + labelWidth('browserbase $', s)), h: y2 + s * 0.4 };
  }

  // mcp-axes: a small horizontal/vertical sketch.
  const h = w * 0.7;
  const ox = size * 0.9;
  const oy = h - size * 1.1;
  svg.append(arrow({ x: ox, y: oy }, { x: w - 4, y: oy - 3 }, `${seed}:x`));
  svg.append(arrow({ x: ox + 2, y: oy }, { x: ox - 2, y: 6 }, `${seed}:y`));
  svg.append(textEl(w * 0.35, oy + size * 0.95, size * 0.8, 'MCP = horizontal'));
  const vert = textEl(0, 0, size * 0.8, 'vertical?');
  vert.setAttribute('transform', `translate(${ox - size * 0.35} ${h * 0.62}) rotate(-90)`);
  svg.append(vert);
  // A few scattered app dots along the horizontal, one circled.
  const r = rng(`${seed}:dots`);
  for (let i = 0; i < 4; i++) {
    const cx = ox + size * 1.2 + i * ((w - ox - size * 2) / 3.2) + (r() - 0.5) * 8;
    const cy = oy - size * (0.6 + r() * 1.6);
    svg.append(ink(wobbly([{ x: cx, y: cy }, { x: cx + 3, y: cy + 3 }], `${seed}:d${i}`, 0.3), 4));
    if (i === 2) svg.append(circle(cx + 1, cy + 1, size * 0.42, `${seed}:ring`));
  }
  return { w, h: h + size * 0.3 };
}

// ----------------------------------------------------------------------------- page packing

const CELL = 6; // occupancy grid resolution in px
const GUTTER_X = 22;
const GUTTER_Y = 8;

/**
 * Fill the page the way a hand fills paper: every section goes into the first free rectangle
 * found scanning top-to-bottom, left-to-right, so short notes slide into gaps beside taller ones.
 */
function pack(views: NoteView[], pageWidth: number, margin: number): number {
  const cols = Math.max(1, Math.floor((pageWidth - margin * 2) / CELL));
  const stride = cols + 1;
  let rows = 256;
  let grid = new Uint8Array(cols * rows);
  // Summed-area table over the occupancy grid, so "is this rectangle free" is O(1).
  // It is kept incrementally: placing a section only dirties rows at and below it.
  let t = new Uint32Array(stride * (rows + 1));
  let validRows = 0; // rows of `t` that are up to date
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
  let bottomRows = 0;

  for (const v of views) {
    const wc = Math.min(cols, Math.ceil((v.w + GUTTER_X) / CELL));
    const hc = Math.ceil((v.h + GUTTER_Y) / CELL);
    if (bottomRows + hc + 1 > rows) {
      const nextRows = rows * 2;
      const g2 = new Uint8Array(cols * nextRows);
      g2.set(grid);
      grid = g2;
      const t2 = new Uint32Array(stride * (nextRows + 1));
      t2.set(t);
      t = t2;
      rows = nextRows;
    }
    // Only rows up to the current bottom can hold a gap; the row at the bottom is always free.
    extend(bottomRows + hc);
    let px = 0;
    let py = bottomRows;
    outer: for (let y = 0; y < bottomRows; y++) {
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
    validRows = Math.min(validRows, py); // rows from py down must be recomputed
    v.el.style.left = `${margin + px * CELL}px`;
    v.el.style.top = `${margin + py * CELL}px`;
    bottomRows = Math.max(bottomRows, py + hc);
  }
  return bottomRows * CELL + margin * 2;
}

async function main(): Promise<void> {
  await document.fonts.load(fontOf(26));
  await document.fonts.load(fontOf(24));
  const page = document.getElementById('page')!;
  const views = notes.map((n) => new NoteView(n));
  for (const v of views) page.append(v.el);

  const timings: { width: number; text: number; pack: number }[] = [];
  const doLayout = () => {
    const width = page.clientWidth;
    const margin = width < 640 ? 14 : 28;
    const size = baseSize();
    const t0 = performance.now();
    for (const v of views) {
      v.prepare(size);
      v.layout(width - margin * 2);
    }
    const t1 = performance.now();
    page.style.height = `${pack(views, width, margin)}px`;
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
