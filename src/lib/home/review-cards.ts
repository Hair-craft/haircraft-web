/**
 * The home page's reviews as tilted cards in a row that slides sideways (owner,
 * 2026-11-24: "we just need the tilted cards design only, not the bounced card
 * design, and it will be horizontally slide, there is no limit of 8"). Each card
 * shows its photo; hovering it (tapping, on a phone) turns it over to the review.
 */

/** How many reviews the home page asks for: every one the admin chose, up to the API's 50. */
export const HOME_REVIEW_COUNT = 50;

/** The cards' tilts, left to right, repeating: a little either way, never in step. */
const TILTS = [-4, 3, -2, 5, -5, 2, -3, 4];

/** The tilt of the card at `index`, in degrees. */
export function cardTilt(index: number): number {
  return TILTS[((index % TILTS.length) + TILTS.length) % TILTS.length];
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
