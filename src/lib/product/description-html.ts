import "server-only";
import sanitizeHtml from "sanitize-html";
import { isPlainDescription } from "./description";

/** The formatting the admin's editor makes (the API keeps the same list). */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
  ],
  allowedAttributes: { a: ["href", "target", "rel"], "*": ["style"] },
  allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The description as safe HTML for the product page. The API already
 * cleans it when it is saved; it is cleaned again here, so the page never
 * shows anything but the editor's formatting. Plain text becomes paragraphs.
 */
export function descriptionHtml(description: string | null): string | null {
  if (!description?.trim()) return null;
  if (isPlainDescription(description))
    return description
      .split(/\n\s*\n|\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
  return sanitizeHtml(description, OPTIONS);
}
