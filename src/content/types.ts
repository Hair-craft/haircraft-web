/**
 * The information pages' text, in a shape the owner's wording can be pasted
 * into: each section is a heading and blocks (a paragraph, or a list).
 * Strings may use `**bold**` and `[link](/path)` (see `lib/info/rich-text.ts`).
 */
export type Block = string | { list: string[] } | { steps: string[] } | { tip: string };

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

/** The text of a block (each list item or step on its own). */
export function blockText(block: Block): string[] {
  if (typeof block === "string") return [block];
  if ("list" in block) return block.list;
  if ("steps" in block) return block.steps;
  return [block.tip];
}
