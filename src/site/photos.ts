// Photo aspect ratios (width / height), measured from the files in public/imgs at build time.
// The layout needs a photo's shape before the file has loaded, and a replaced photo should never
// need a matching edit here, so the build injects the real numbers rather than notes.ts carrying them.

declare const __PHOTO_ASPECTS__: Record<string, number>;

const aspects: Record<string, number> = typeof __PHOTO_ASPECTS__ === 'undefined' ? {} : __PHOTO_ASPECTS__;

/** Square is the safe shape if a photo is missing: it crops the least either way. */
export function aspectOf(src: string): number {
  return aspects[src] ?? 1;
}
