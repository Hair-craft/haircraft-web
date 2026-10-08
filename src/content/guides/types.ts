import { blockText, type InfoSection } from "../types";

/**
 * A hair guide (`/guides/<slug>`). DRAFT — OWNER TO CONFIRM: every guide's
 * text, especially care advice and anything about the hair itself.
 */
export interface Guide {
  slug: string;
  /** The headline, with the words people search for. */
  title: string;
  /** One or two sentences: the guide's card, its search description and its intro. */
  summary: string;
  /** "YYYY-MM-DD", shown as "Last updated". */
  updated: string;
  /** Categories this guide is about (paths from `shopLinks`), shown as "Shop the look". */
  shop: { label: string; href: string }[];
  sections: InfoSection[];
}

/** Words in a guide (for reading time). */
export function wordCount(guide: Guide): number {
  const text = [
    guide.summary,
    ...guide.sections.flatMap((section) => [section.heading, ...section.blocks.flatMap(blockText)]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/** Minutes to read at about 200 words a minute, at least 1. */
export function readingMinutes(guide: Guide): number {
  return Math.max(1, Math.round(wordCount(guide) / 200));
}
