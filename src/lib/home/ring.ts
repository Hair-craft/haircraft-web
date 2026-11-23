/**
 * Geometry of the home page's 3D product ring (owner, 2026-11-23). Face `i`
 * stands at `i * step` degrees round the ring; the ring itself is turned by
 * `rotation` degrees, so face `i` faces front when `i * step + rotation` is a
 * whole turn. Turning to the next product makes `rotation` smaller.
 */

/** A ring needs at least 3 products; fewer stay a plain row. */
export const MIN_RING_ITEMS = 3;

/**
 * Every ring has at least 16 panels (owner, 2026-11-23: Best rated and New
 * arrivals look the same, with a gentle curve): fewer products go round more
 * than once, each as often.
 */
export const FULL_RING = 16;

/** How many panels stand round the ring for `products` products. */
export const ringFaces = (products: number) =>
  products >= FULL_RING ? products : products * Math.ceil(FULL_RING / products);

export const ringStep = (count: number) => 360 / count;

/** -180..180: how far face `i` is turned away from the front. */
export function faceAngle(index: number, rotation: number, count: number): number {
  const angle = (((index * ringStep(count) + rotation) % 360) + 360) % 360;
  return angle > 180 ? angle - 360 : angle;
}

/** The face nearest the front. */
export function frontIndex(rotation: number, count: number): number {
  const index = Math.round(-rotation / ringStep(count)) % count;
  return (index + count) % count;
}

/** The rotation that brings face `index` to the front with the least turning from `rotation`. */
export function rotationFor(index: number, rotation: number, count: number): number {
  return rotation - faceAngle(index, rotation, count);
}

/**
 * Where the ring comes to rest after a drag: it carries on a little with the
 * flick's speed (degrees per millisecond), then stops with a face at the front.
 * A flick carries it at most one full turn.
 */
export function restingRotation(rotation: number, velocity: number, count: number): number {
  const step = ringStep(count);
  const carry = Math.max(-360, Math.min(360, velocity * 220));
  return Math.round((rotation + carry) / step) * step || 0;
}

/** The photo's sideways shift for the parallax, in px: 0 at the front, ±max at the sides. */
export function parallaxShift(angle: number, max = 40): number {
  const turned = Math.max(-90, Math.min(90, angle));
  return Math.round((-turned / 90) * max * 10) / 10 || 0;
}
