// Hovering a print puts it under a spotlight: the rest of the page dims behind a fixed overlay while the
// print itself stays exactly where it is, lifted above the overlay, with its description written beside it.
//
// The print is never moved or copied: its note is raised with z-index above the overlay, so it keeps its
// place, tilt, and shadow. The caption is the only new thing on screen, placed on whichever side of the
// print has room in the viewport (below, then above, then right, then left).

const GAP = 18; // paper between the print and its caption
const EDGE = 16; // caption never comes closer than this to the window edge

interface Spot {
  note: HTMLElement;
  photo: Element;
  text: string;
}

let overlay: HTMLElement | null = null;
let caption: HTMLElement | null = null;
let current: Spot | null = null;

function ensure(): { overlay: HTMLElement; caption: HTMLElement } {
  if (overlay && caption) return { overlay, caption };
  overlay = document.createElement('div');
  overlay.className = 'spotlight';
  overlay.setAttribute('aria-hidden', 'true');
  caption = document.createElement('p');
  caption.className = 'spotlight-caption';
  overlay.append(caption);
  document.body.append(overlay);
  return { overlay, caption };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Put the caption next to the print without covering it, preferring below, then above, then either side. */
function place(): void {
  if (!current || !caption) return;
  if (!current.photo.isConnected) return close(current); // the page was relaid out and the print redrawn
  const r = current.photo.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Write about as wide as the print, but never so narrow it wraps every other word or so wide it looks like prose.
  caption.style.width = `${clamp(r.width * 1.1, 220, Math.min(420, vw - EDGE * 2))}px`;
  const cw = caption.offsetWidth;
  const ch = caption.offsetHeight;

  const centredX = clamp(r.left + r.width / 2 - cw / 2, EDGE, vw - EDGE - cw);
  const centredY = clamp(r.top + r.height / 2 - ch / 2, EDGE, vh - EDGE - ch);
  let left: number;
  let top: number;
  if (r.bottom + GAP + ch <= vh - EDGE) {
    left = centredX;
    top = r.bottom + GAP;
  } else if (r.top - GAP - ch >= EDGE) {
    left = centredX;
    top = r.top - GAP - ch;
  } else if (r.right + GAP + cw <= vw - EDGE) {
    left = r.right + GAP;
    top = centredY;
  } else if (r.left - GAP - cw >= EDGE) {
    left = r.left - GAP - cw;
    top = centredY;
  } else {
    // A print taller and wider than the window: tuck the caption into the bottom corner of the window instead.
    left = vw - EDGE - cw;
    top = vh - EDGE - ch;
  }
  caption.style.left = `${Math.round(left)}px`;
  caption.style.top = `${Math.round(top)}px`;
}

function open(spot: Spot): void {
  const { overlay, caption } = ensure();
  if (current) current.note.classList.remove('lit');
  current = spot;
  spot.note.classList.add('lit');
  caption.textContent = spot.text;
  overlay.classList.add('on');
  place();
  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);
}

function close(spot: Spot): void {
  if (current !== spot) return;
  current = null;
  spot.note.classList.remove('lit');
  overlay?.classList.remove('on');
  window.removeEventListener('scroll', place);
  window.removeEventListener('resize', place);
}

/** Only pointers that can hover get a spotlight; a finger on a tablet just sees the page. */
const canHover = typeof matchMedia === 'function' && matchMedia('(hover: hover)').matches;

/**
 * Spotlight `photo` (the print's group) whenever the pointer is over it. `note` is the element the print
 * lives in, which is what gets lifted above the overlay.
 */
export function spotlight(note: HTMLElement, photo: Element, text: string): void {
  if (!canHover) return;
  const spot: Spot = { note, photo, text };
  photo.addEventListener('pointerenter', () => open(spot));
  photo.addEventListener('pointerleave', () => close(spot));
}
