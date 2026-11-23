/**
 * The home page's reviews as React Bits' "Bounce Cards" (owner, 2026-11-23):
 * up to 8 cards in a fan; each shows its photo filling the card, and clicking
 * one flips it over to the customer's review.
 */

/** How many reviews the home page shows (the API allows at most 8). */
export const HOME_REVIEW_COUNT = 8;

/** Each card's turn, left to right (React Bits' own five first: 10, 5, -3, -10, 2). */
const TURNS = [10, 5, -3, -10, 2, 7, -6, 4];

/**
 * Each card's resting transform for `count` cards (at most 8), `step` px apart,
 * centred. With 5 cards 100 px apart this is React Bits' own fan.
 */
export function bounceTransforms(count: number, step = 100): string[] {
  const n = Math.max(0, Math.min(HOME_REVIEW_COUNT, count));
  const turns = n === 5 ? TURNS.slice(0, 5) : spreadTurns(n);
  return turns.map((turn, i) => {
    const x = Math.round((i - (n - 1) / 2) * step);
    return `rotate(${turn}deg) translate(${x}px)`;
  });
}

/** Turns for a fan that isn't 5 cards: tipped outwards at the ends, a little either way between. */
function spreadTurns(n: number): number[] {
  if (n === 1) return [-3];
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1); // 0 … 1, left to right
    const outward = Math.round(10 - 20 * t); // 10° on the left … -10° on the right
    const wobble = i % 2 === 0 ? 2 : -2;
    return i === 0 || i === n - 1 ? outward : outward + wobble;
  });
}

/**
 * How the fan is laid out: on a computer the cards spread out; on a phone they
 * overlap more so all of them fit. `push` is how far a lifted card's
 * neighbours move aside.
 */
export function fanLayout(phone: boolean, count: number): { step: number; push: number } {
  if (phone) return { step: count > 5 ? 30 : 45, push: 70 };
  return { step: 100, push: count > 5 ? 120 : 160 };
}

/** The same card straightened (React Bits' getNoRotationTransform). */
export function straightTransform(transform: string): string {
  if (/rotate\([\s\S]*?\)/.test(transform))
    return transform.replace(/rotate\([\s\S]*?\)/, "rotate(0deg)");
  if (transform === "none") return "rotate(0deg)";
  return `${transform} rotate(0deg)`;
}

/** The same card pushed sideways by `offsetX` px (React Bits' getPushedTransform). */
export function pushedTransform(transform: string, offsetX: number): string {
  const translate = /translate\(([-0-9.]+)px\)/;
  const match = transform.match(translate);
  if (match) return transform.replace(translate, `translate(${parseFloat(match[1]) + offsetX}px)`);
  return transform === "none" ? `translate(${offsetX}px)` : `${transform} translate(${offsetX}px)`;
}

/**
 * The picture on a review card (owner, 2026-11-23: every card shows one): the
 * customer's own photo, else the product's main photo, else none.
 */
export function reviewCardPicture(featured: {
  review: { reviewerName: string; photos: { urls: { large: string; medium: string } }[] };
  product: { name: string; image?: { medium: string } | null };
}): { src: string; alt: string } | null {
  const own = featured.review.photos[0];
  if (own)
    return {
      src: own.urls.medium,
      alt: `Photo by ${featured.review.reviewerName} of ${featured.product.name}`,
    };
  if (featured.product.image)
    return { src: featured.product.image.medium, alt: featured.product.name };
  return null;
}

/** When the review was written, e.g. "23 Nov 2026" (India time, the same on server and phone). */
export function reviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
