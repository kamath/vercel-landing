// The SF -> NYC doodle, drawn the way a hand draws it, as one motion. The pen draws the Golden Gate first: the two
// poles, the road left to right, and straight on from the road's end the cable arch back over the poles. It lifts to the top of the left pole, takes off into
// the flight, arches over, comes down in front of New York and draws the skyline left to right, ending at the last
// building's foot. The flight is a shooting star: only a short tail follows the pen, so the arc is never seen whole.
// A city holds once drawn, then collapses: an eraser goes over it in its own order (the bridge: the road beyond the
// right pole out into the arch, the arch right to left, the right pole's top and bottom into its crossing with the
// road, then the road from both sides into the left pole's crossing; the skyline: left to right). The left pole is
// never erased: the bridge collapses into it, it stands alone a beat, and then it is the shooting star's tail, the
// star running down the pole, into the bridge's bottom left corner and away in the arc to NYC. So: the bridge, its
// collapse into the left pole, the star from there to NYC and the skyline, its collapse, the star from the
// skyline's bottom right corner back to SF, landing on the top of the left pole and going straight on down it to
// draw the bridge again, just as before.
// Forever. One clock, one pen speed (the eraser is quicker); a lift takes the time the pen needs to cross the gap.

import { ink, wobbly, type XY } from './doodle.js';

const SPEED = 0.7; // widths per second the pen moves at, so a drawing takes the same time at any size
const HOLD = 1; // seconds a finished city stays before it collapses
const ERASER = 1.2; // how much faster than the pen the eraser moves
const PULL = 0.25; // seconds at least for each move of the eraser, so a collapse of short pieces is still seen
const BLANK = 0.3; // seconds the left pole stands alone, all that is left of the bridge, before the star sets off
const TAIL = 0.15; // the shooting star's tail, as a fraction of the width

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
/** Mostly constant pen speed, with a soft start and a soft stop. */
const pace = (p: number) => p + 0.3 * (ease(p) - p);

const shift = (pts: XY[], by: XY): XY[] => pts.map((p) => ({ x: p.x + by.x, y: p.y + by.y }));

// ----------------------------------------------------------------------------- drawings

/** A stroke of the pen: a polyline with the pen width it is drawn at. The pen lifts between strokes. */
interface Stroke {
  pts: XY[];
  width: number;
  amp?: number;
}

/**
 * The Golden Gate in a box `W` wide and `H` tall, standing on y = 0 at x = 0, in the order a hand draws it: the two
 * poles from the top down, the road left to right, then without lifting the cable arch from the right anchor back
 * over both poles to the left. `top` is the top of the left pole, where the flight back lands. `crossing` is where the road meets the poles: how far
 * along the road each pole is, and how far down a pole the road is.
 */
function goldenGate(W: number, H: number): { strokes: Stroke[]; top: XY; crossing: { road: number[]; pole: number } } {
  const poleX = [W * 0.3, W * 0.7];
  const roadY = -H * 0.3;
  const top = poleX.map((x) => ({ x, y: -H }));
  // The arch, from the right: up the side cable to the right pole, sagging between the poles, down to the left anchor.
  const arch: XY[] = [{ x: W, y: roadY }, top[1]];
  for (let i = 1; i < 16; i++) {
    const u = i / 16;
    arch.push({ x: top[1].x + (top[0].x - top[1].x) * u, y: -H + 4 * u * (1 - u) * (H * 0.55) });
  }
  arch.push(top[0], { x: 0, y: roadY });

  const strokes: Stroke[] = [
    { pts: [top[0], { x: poleX[0], y: 0 }], width: 2.1 }, // left pole, top down
    { pts: [top[1], { x: poleX[1], y: 0 }], width: 2.1 }, // right pole
    { pts: [{ x: 0, y: roadY }, { x: W, y: roadY }], width: 1.6 }, // road, left to right
    { pts: arch, width: 1.8 }, // the arch, right to left, straight on from the road
  ];
  return { strokes, top: top[0], crossing: { road: poleX.map((x) => x / W), pole: (H + roadY) / H } };
}

/**
 * Three New York landmarks as one pen path in a box `W` wide, `H` tall, standing on y = 0 at x = 0, drawn from
 * the left foot to the right: Chrysler, Empire State, One WTC, with the ground between them.
 */
function skyline(W: number, H: number): XY[] {
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
  // The spire is a needle: the pen goes up it and back down the same line.
  const wtc = (x: number, w: number, h: number): XY[] => [
    { x, y: 0 }, { x: x + w * 0.06, y: -h }, { x: x + w * 0.5, y: -h }, { x: x + w * 0.5, y: -h - H * 0.3 },
    { x: x + w * 0.5, y: -h }, { x: x + w * 0.94, y: -h }, { x: x + w, y: 0 },
  ];
  return [
    { x: 0, y: 0 },
    ...chrysler(0.03 * W, 0.24 * W, 0.46 * H),
    ...empire(0.37 * W, 0.26 * W, 0.82 * H),
    ...wtc(0.71 * W, 0.28 * W, 0.86 * H),
    { x: W, y: 0 },
  ];
}

// ----------------------------------------------------------------------------- scene

export interface FlightScene {
  w: number;
  h: number;
  stop: () => void;
  /** Pause and resume the clock (used while the doodle is scrolled out of view). */
  pause: () => void;
  resume: () => void;
  /** Jump the clock to a given second of the loop (debugging aid). */
  seek: (t: number) => void;
  /** The stroke's timing, in seconds and pixels (debugging aid). */
  timeline: Record<string, number>;
  /** Frames rendered so far (debugging aid). */
  frames: () => number;
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
  const ground = h * 0.78;
  const from: XY = { x: w * 0.06, y: ground }; // the bridge's left end
  const to: XY = { x: w * 0.94, y: ground }; // the skyline's right end

  // The bridge stands at SF, the skyline at NYC, both on the same ground line.
  const bridgeH = w * 0.14;
  const bridge = goldenGate(w * 0.32, bridgeH);
  const cityW = w * 0.28;
  const cityH = w * 0.17;
  const cityOrigin: XY = { x: to.x - cityW, y: ground };
  const launch: XY = from; // the bridge's bottom left corner
  const poleTop: XY = { x: from.x + bridge.top.x, y: from.y + bridge.top.y };
  const poleFoot: XY = { x: poleTop.x, y: ground };
  const land: XY = cityOrigin;
  // The flight leaves the bridge's near corner steeply, arches over, and comes down in front of the city. The return
  // flight mirrors it: up from the skyline's far corner, down onto the top of the left pole.
  const corner: XY = to;
  const curve = (a: XY, b: XY, dir: 1 | -1) =>
    `C${(a.x + dir * w * 0.05).toFixed(1)} ${(a.y - h * 0.78).toFixed(1)}, ` +
    `${(b.x - dir * w * 0.14).toFixed(1)} ${(ground - h * 0.9).toFixed(1)}, ` +
    `${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  const arc = (a: XY, b: XY, dir: 1 | -1) => `M${a.x.toFixed(1)} ${a.y.toFixed(1)} ${curve(a, b, dir)}`;
  // Out from SF the star starts as the left pole itself: it runs down the pole, along the ground into the bottom
  // left corner, and only there sets off in the arc. So the path begins at the top of the pole, and the star's head
  // opens a tail's length along it, which is exactly what the collapse leaves standing.
  const round = w * 0.012; // the turn at the pole's foot, taken as a bend rather than a corner
  const flightOut =
    `M${poleTop.x.toFixed(1)} ${poleTop.y.toFixed(1)} L${poleFoot.x.toFixed(1)} ${(poleFoot.y - round).toFixed(1)} ` +
    `Q${poleFoot.x.toFixed(1)} ${poleFoot.y.toFixed(1)} ${(poleFoot.x - round).toFixed(1)} ${poleFoot.y.toFixed(1)} ` +
    `L${launch.x.toFixed(1)} ${launch.y.toFixed(1)} ${curve(launch, land, 1)}`;

  // The strokes, with their end points so a lift between two strokes costs the pen the time to cross the gap.
  const city = shift(skyline(cityW, cityH), cityOrigin);
  const strokes: { el: SVGPathElement; from: XY; to: XY }[] = [
    ...bridge.strokes.map((s, i) => {
      const pts = shift(s.pts, from);
      return { el: ink(wobbly(pts, `${seed}:sf${i}`, s.amp ?? 0.35, 5), s.width), from: pts[0], to: pts[pts.length - 1] };
    }),
    { el: ink(flightOut, 2), from: poleTop, to: land },
    { el: ink(wobbly(city, `${seed}:nyc`, 0.5, 5), 1.7), from: city[0], to: city[city.length - 1] },
    { el: ink(arc(corner, poleTop, -1), 2), from: corner, to: poleTop },
  ];
  const [leftPole, rightPole, road, arch, flight, nyc, flightBack] = strokes.map((_, i) => i);
  const els = strokes.map((s) => s.el);
  svg.append(...els);

  const labelSize = size * 0.85;
  const baseline = ground + size * 0.95;
  const fromText = textEl(from.x - size * 0.3, baseline, labelSize, labels.from);
  const toW = labelWidth(labels.to, labelSize);
  const toText = textEl(to.x + size * 0.3 - toW, baseline, labelSize, labels.to);
  svg.append(fromText, toText);

  // One pen. A segment is the order some strokes are drawn in, and which way along each the pen goes; a stroke draws
  // once the pen has travelled the length of everything before it, lifts included. Each segment is drawn, held,
  // erased in its own order (the flight is left out: a star's tail has burnt out by then) and followed by a blank.
  const lens = els.map((el) => el.getTotalLength());
  const speed = w * SPEED;
  type Step = { i: number; back: boolean };
  /** Lay `order` out along a route: where each stroke starts, and the route's length, lifts included. */
  const route = (order: Step[]) => {
    let total = 0;
    let pen: XY | null = null;
    const steps = order.map(({ i, back }) => {
      const s = strokes[i];
      const [head, tail] = back ? [s.to, s.from] : [s.from, s.to];
      if (pen) total += Math.hypot(head.x - pen.x, head.y - pen.y); // the lift
      const at = total;
      total += lens[i];
      pen = tail;
      return { i, back, at };
    });
    return { steps, total };
  };
  /** A piece of a stroke's path, from length `from` to length `to`, that the eraser takes starting at `from`, `after` seconds into its group. */
  type Piece = { i: number; from: number; to: number; after?: number };
  /** The eraser's schedule, in seconds: the pieces in each group go together (bar any `after`), each over its own length in the time the longest takes. */
  const eraseRoute = (groups: Piece[][]) => {
    let total = 0;
    const pieces = groups.flatMap((group) => {
      const span = Math.max(PULL, Math.max(...group.map((pc) => Math.abs(pc.to - pc.from))) / (speed * ERASER));
      const at = total;
      total += span + Math.max(...group.map((pc) => pc.after ?? 0));
      return group.map((pc) => ({ ...pc, at: at + (pc.after ?? 0), span }));
    });
    return { pieces, total };
  };
  /**
   * `head0` is how far along the route the pen's head already is when the segment opens: what is on the page before
   * it moves. `becomes` is a stroke that takes over from another (`was`) as the collapse runs, its head creeping
   * from `from` to `to` over it, so what the collapse leaves standing is already the star, at the star's own size.
   */
  const segment = (drawOrder: Step[], eraseGroups: Piece[][], head0 = 0, becomes?: { i: number; was: number; from: number; to: number }) => {
    const drawn = route(drawOrder);
    const erased = eraseRoute(eraseGroups);
    const draw = (drawn.total - head0) / speed;
    const erase = erased.total;
    return { ...drawn, head0, becomes, erased: erased.pieces, draw, erase, length: draw + HOLD + erase + BLANK };
  };
  const whole = (i: number, back = false): Piece => (back ? { i, from: lens[i], to: 0 } : { i, from: 0, to: lens[i] });
  const bridgeDraw: Step[] = [leftPole, rightPole, road, arch].map((i) => ({ i, back: false }));
  // The eraser over the bridge: the road beyond the right pole, out into the arch; the arch, right to left; the right
  // pole's top and bottom at once, into its crossing with the road; then the road from both sides into its crossing
  // with the left pole. The left pole is left whole: the bridge collapses into it and it stays to become the star.
  const [r1, r2] = bridge.crossing.road.map((f) => lens[road] * f); // the crossings, along the road
  const poleY = (i: number) => lens[i] * bridge.crossing.pole; // the crossing, down a pole
  const bridgeErase: Piece[][] = [
    [{ i: road, from: r2, to: lens[road] }],
    [whole(arch)],
    [{ i: rightPole, from: 0, to: poleY(rightPole) }, { i: rightPole, from: lens[rightPole], to: poleY(rightPole) }],
    [{ i: road, from: r2, to: r1 }, { i: road, from: 0, to: r1 }],
  ];
  const cityErase: Piece[][] = [[whole(nyc)]];
  // The star sets off with a whole tail behind it, so its head starts a tail's length along the flight path: down
  // the pole and a touch beyond. Over the collapse the standing pole grows exactly that far, so nothing jumps.
  const star = w * TAIL;
  const intoStar = { i: flight, was: leftPole, from: bridgeH, to: star };
  const prelude = segment(bridgeDraw, bridgeErase, 0, intoStar); // the bridge alone, once, at the start
  const loop = [
    segment([{ i: flight, back: false }, { i: nyc, back: false }], cityErase, star), // the star, the pole it grew out of, runs on to NYC and draws the skyline
    segment([{ i: flightBack, back: false }, ...bridgeDraw], bridgeErase, 0, intoStar), // the star back to SF, landing on the left pole, then the bridge as before
  ];
  const period = loop[0].length + loop[1].length;
  /** At second `t`: which segment is on the page, how far the pen's head is along its route, and how many seconds the eraser is into its schedule. */
  const phase = (t: number): { seg: typeof prelude; head: number; eraser: number } => {
    let seg = prelude;
    let u = t;
    if (u >= prelude.length) {
      u = (u - prelude.length) % period;
      seg = u < loop[0].length ? loop[0] : loop[1];
      if (seg === loop[1]) u -= loop[0].length;
    }
    const { total, draw, erase, head0 } = seg;
    if (u < draw) return { seg, head: head0 + (total - head0) * pace(u / draw), eraser: 0 };
    if (u < draw + HOLD) return { seg, head: total, eraser: 0 };
    if (u < draw + HOLD + erase) return { seg, head: total, eraser: erase * pace((u - draw - HOLD) / erase) };
    return { seg, head: total, eraser: erase };
  };
  /** Show a stroke's ink on the given spans of its path (sorted, apart), as one dash per span. */
  const setInk = (i: number, spans: [number, number][]) => {
    const el = els[i];
    spans = spans.filter(([a, b]) => b - a > 0.01);
    if (spans.length === 0) {
      el.style.visibility = 'hidden';
      return;
    }
    const dashes: number[] = [];
    spans.forEach(([a, b], k) => dashes.push(b - a, k + 1 < spans.length ? spans[k + 1][0] - b : lens[i] + 1));
    el.style.visibility = '';
    el.style.strokeDasharray = dashes.join(' ');
    el.style.strokeDashoffset = `${-spans[0][0]}`; // the first dash starts this far along the path
  };
  /** `spans` with `[a, b]` taken out of them. */
  const cut = (spans: [number, number][], a: number, b: number): [number, number][] =>
    spans.flatMap(([lo, hi]) => (b <= lo || a >= hi ? [[lo, hi]] : [[lo, Math.max(lo, a)] as [number, number], [Math.min(hi, b), hi] as [number, number]]));
  const show = (t: number) => {
    const { seg, head, eraser } = phase(t);
    els.forEach((_, i) => setInk(i, [])); // only the current segment's strokes are on the page
    for (const { i, back, at } of seg.steps) {
      const len = lens[i];
      // What the pen has laid, as lengths along the route, then along the path (a `back` stroke is drawn from its far end).
      const b = Math.max(0, Math.min(len, head - at));
      const a = Math.max(0, Math.min(len, (i === flight || i === flightBack ? head - w * TAIL : 0) - at)); // the star's short tail
      let spans: [number, number][] = [back ? [len - b, len - a] : [a, b]];
      // What the eraser has taken back.
      for (const pc of seg.erased) {
        if (pc.i !== i) continue;
        const gone = pc.from + (pc.to - pc.from) * Math.max(0, Math.min(1, (eraser - pc.at) / pc.span));
        spans = cut(spans, Math.min(pc.from, gone), Math.max(pc.from, gone));
      }
      setInk(i, spans);
    }
    // As the bridge collapses into the left pole, the pole becomes the star: its ink is handed to the flight path,
    // whose head creeps out to a full tail's length, so the thing left standing is the star, ready to go.
    if (seg.becomes && eraser > 0) {
      const { i, was, from, to } = seg.becomes;
      setInk(was, []);
      setInk(i, [[0, from + (to - from) * Math.min(1, eraser / seg.erase)]]);
    }
  };
  const timeline: Record<string, number> = { prelude: prelude.length, period, bridge: prelude.draw, bridgeErase: prelude.erase, out: loop[0].draw, cityErase: loop[0].erase, back: loop[1].draw, hold: HOLD, blank: BLANK };
  const scene = { w, h: ground + size * 1.05, timeline };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    // The whole picture: the outbound flight from the corner on, so its run down the pole does not double the pole.
    const still = bridgeH + Math.hypot(poleFoot.x - launch.x, poleFoot.y - launch.y);
    els.forEach((_, i) => setInk(i, i === flightBack ? [] : [[i === flight ? still : 0, lens[i]]]));
    return { ...scene, stop: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, frames: () => 0 };
  }
  show(0);

  let start = performance.now();
  let raf = 0;
  let running = true;
  let pausedAt = 0;
  let frames = 0;
  const frame = (now: number) => {
    frames++;
    show((now - start) / 1000);
    if (running) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    ...scene,
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    pause: () => {
      if (!running) return;
      running = false;
      pausedAt = performance.now();
      cancelAnimationFrame(raf);
    },
    resume: () => {
      if (running) return;
      running = true;
      start += performance.now() - pausedAt; // pick up where it left off
      raf = requestAnimationFrame(frame);
    },
    seek: (t) => {
      start = performance.now() - t * 1000;
      if (!running) show(t);
    },
    frames: () => frames,
  };
}
