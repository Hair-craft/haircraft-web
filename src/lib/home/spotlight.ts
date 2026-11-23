/**
 * The "Shop by concern" spotlight slider (owner, 2026-11-23, after MDJAmin's
 * sample): the active concern fills the box; the one before it stays full
 * size underneath (so the next one grows over it); the next 3 wait as small
 * cards; the rest wait out of sight on the right.
 */
export type SpotSlot = "under" | "main" | "q1" | "q2" | "q3" | "out";

/** Where item `index` stands when item `active` is in the spotlight, of `count`. */
export function spotSlot(index: number, active: number, count: number): SpotSlot {
  if (count <= 0) return "out";
  const ahead = (((index - active) % count) + count) % count;
  if (ahead === 0) return "main";
  // With only 2 concerns, the other one is the next card, not the one underneath.
  if (ahead === count - 1 && count > 2) return "under";
  if (ahead === 1) return "q1";
  if (ahead === 2) return "q2";
  if (ahead === 3) return "q3";
  return "out";
}

/** The next active item, going round (by +1 or -1). */
export function spotStep(active: number, by: number, count: number): number {
  if (count <= 0) return 0;
  return (((active + by) % count) + count) % count;
}

/** How many small cards wait on the right for `count` concerns (at most 3). */
export function waitingCards(count: number): number {
  if (count <= 1) return 0;
  if (count === 2) return 1;
  // The rest, less the one in the spotlight and the one underneath.
  return Math.min(3, count - 2);
}
