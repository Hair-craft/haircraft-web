/**
 * The Photo Deck's rules (owner, 2026-11-24, after 21st.dev's "Photo Deck"):
 * a stack of photo prints that you step through, going round.
 */

/** The print `by` steps from `active`, going round. */
export function deckStep(active: number, by: number, count: number): number {
  if (count <= 0) return 0;
  return (((active + by) % count) + count) % count;
}

/** The prints in the stack from the top: the active one, then the next few. */
export function deckStack(active: number, count: number, depth = 4): number[] {
  return Array.from({ length: Math.min(depth, count) }, (_, i) => deckStep(active, i, count));
}

/**
 * How a print lies in the stack, `place` prints down from the top: a little
 * lower, smaller and turned, alternately left and right.
 */
export function deckPose(place: number): { rotate: number; x: number; y: number; scale: number } {
  if (place === 0) return { rotate: 0, x: 0, y: 0, scale: 1 };
  const side = place % 2 === 1 ? 1 : -1;
  return {
    rotate: side * (4 + place * 2.5),
    x: side * place * 16,
    y: place * 8,
    scale: 1 - place * 0.035,
  };
}

/** The counter's digits, two at least: 3 of 8 → "03" / "08". */
export function counterDigits(value: number, total: number): string {
  const width = Math.max(2, String(total).length);
  return String(value).padStart(width, "0");
}
