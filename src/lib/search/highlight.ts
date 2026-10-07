/** A piece of text, and whether it matches one of the searched words. */
export interface Segment {
  text: string;
  match: boolean;
}

/**
 * Splits `text` so the parts matching the searched words can be shown in
 * bold: "Body Wave Clip-in" for "wave cl" → Body ·Wave· ·Cl·ip-in. Words
 * under 2 letters are ignored (they would light up everything). Pure.
 */
export function highlight(text: string, query: string): Segment[] {
  const words = [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 2),
    ),
  ].sort((a, b) => b.length - a.length);
  if (words.length === 0 || text === "") return text === "" ? [] : [{ text, match: false }];

  const pattern = new RegExp(
    `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "giu",
  );
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: words.includes(part.toLowerCase()) }));
}
