import type { ImageUrls, PublicConcern } from "@/lib/api/types";

/**
 * "Shop by concern" on the home page (owner, 2026-11-03). The cards, their
 * order, the heading and the line under it are managed in the admin panel
 * (Catalog → Shop by concern); the API sends only the shown ones.
 */

/**
 * The photo a card shows: the concern's own photo (with its description),
 * else its category's photo (decorative: the card's title says it all), else
 * none.
 */
export function concernPhoto(
  concern: Pick<PublicConcern, "image" | "imageAlt">,
  categoryPhoto: ImageUrls | null,
): { src: string; alt: string } | null {
  if (concern.image) return { src: concern.image.medium, alt: concern.imageAlt ?? "" };
  if (categoryPhoto) return { src: categoryPhoto.medium, alt: "" };
  return null;
}
