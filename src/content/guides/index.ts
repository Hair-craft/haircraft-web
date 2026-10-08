import { careGuide } from "./care";
import { chooseHairExtensions } from "./choose-hair-extensions";
import { clipInVsTapeInVsTopper } from "./clip-in-vs-tape-in-vs-topper";
import { hairToppers } from "./hair-toppers";
import type { Guide } from "./types";
import { weddingHair } from "./wedding-hair";

/** Every guide, in the order of the guides page. Add new ones here. */
export const GUIDES: Guide[] = [
  chooseHairExtensions,
  clipInVsTapeInVsTopper,
  hairToppers,
  careGuide,
  weddingHair,
];

export function findGuide(slug: string): Guide | null {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export type { Guide } from "./types";
export { readingMinutes, wordCount } from "./types";
