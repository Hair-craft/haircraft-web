/**
 * The information pages' text, in a shape the owner's wording can be pasted
 * into: each section is a heading and blocks (a paragraph, or a list).
 * Strings may use `**bold**` and `[link](/path)` (see `lib/info/rich-text.ts`).
 */
export type Block = string | { list: string[] } | { steps: string[] };

export interface InfoSection {
  /** The section's address on the page (`/returns#damaged`). */
  id: string;
  heading: string;
  blocks: Block[];
}

export interface InfoContent {
  /** A sentence or two under the title. */
  intro: string;
  /** Short points shown in a box at the top (Shipping, Returns). */
  summary?: string[];
  sections: InfoSection[];
}
