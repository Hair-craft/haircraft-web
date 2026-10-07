/**
 * The information pages' text is plain strings with two marks, so the owner's
 * wording can be pasted in as it is:
 *
 * - `**words**` for bold
 * - `[words](/returns)` for a link (shop paths, `#section`, `mailto:`, `tel:`
 *   and `https:` only)
 */
export type RichPart =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string; external: boolean };

const SAFE_HREF = /^(\/(?!\/)|#|mailto:|tel:|https:\/\/)/;
const MARK = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseRich(source: string): RichPart[] {
  const parts: RichPart[] = [];
  let last = 0;
  for (const match of source.matchAll(MARK)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: "text", text: source.slice(last, index) });
    if (match[1] !== undefined) parts.push({ kind: "bold", text: match[1] });
    else if (SAFE_HREF.test(match[3]))
      parts.push({
        kind: "link",
        text: match[2],
        href: match[3],
        external: match[3].startsWith("https://"),
      });
    else parts.push({ kind: "text", text: match[2] });
    last = index + match[0].length;
  }
  if (last < source.length) parts.push({ kind: "text", text: source.slice(last) });
  return parts;
}

/** The text without marks (for search engines' FAQ data and page descriptions). */
export function plainText(source: string): string {
  return parseRich(source)
    .map((part) => part.text)
    .join("");
}
