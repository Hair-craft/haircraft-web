/**
 * A product description is HTML from the admin panel's rich editor (bold,
 * lists, headings, alignment), or plain text on older products. These pure
 * helpers read it as plain text, e.g. for search results and share cards.
 */

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

/** The description's words without any formatting, on one line. */
export function descriptionText(description: string | null): string {
  if (!description) return "";
  return description
    .replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, " ")
    .trim();
}

/** Text with no tags at all: an older plain-text description. */
export function isPlainDescription(description: string): boolean {
  return !/<[a-z][^>]*>/i.test(description);
}
