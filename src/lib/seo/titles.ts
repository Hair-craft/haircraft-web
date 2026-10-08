import type { PublicProduct } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { alwaysFree, type ShopPolicies } from "@/lib/info/policies";

/**
 * Keyword-led titles and descriptions for search results (S15b). Built from
 * the catalogue, so they stay true. Google shows about 60 characters of a
 * title and 155–160 of a description; "| HairCraft" is added to titles by
 * the root layout's template.
 */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
const BRAND_SUFFIX = " | HairCraft".length;

/** The home page's title (used as-is, without the "| HairCraft" suffix). */
export const HOME_TITLE = "HairCraft — Human Hair Extensions, Toppers & Wigs in India";

export const HOME_DESCRIPTION =
  "Shop 100% human hair extensions in India: clip-ins, toppers for thinning hair, tape-ins, wigs and ponytails in every length and shade. Tracked delivery.";

/** Text cut at a word boundary, with an ellipsis, so it fits `max` characters. */
export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,.;:—-]+$/, "")}…`;
}

/** "18 inch", "14–22 inch", or null without lengths. */
export function lengthRange(lengths: number[]): string | null {
  const sorted = [...new Set(lengths)].filter((n) => n > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? `${first} inch` : `${first}–${last} inch`;
}

const mentionsHumanHair = (name: string) => /human\s*hair/i.test(name);

/**
 * "Wrap-around Ponytail — Human Hair, 22 inch". Facts are dropped from
 * the end when the title (with "| HairCraft") would be too long.
 */
export function productTitle(product: Pick<PublicProduct, "name" | "options">): string {
  const facts = [
    // "100%" is in the description; the title keeps its few characters for the length.
    mentionsHumanHair(product.name) ? null : "Human Hair",
    lengthRange(product.options.lengths),
  ].filter((fact): fact is string => fact !== null);
  const room = TITLE_MAX - BRAND_SUFFIX;
  while (facts.length > 0) {
    const title = `${product.name} — ${facts.join(", ")}`;
    if (title.length <= room) return title;
    facts.pop();
  }
  return product.name;
}

/** "from ₹4,999" (or "₹4,999" when every option costs the same). */
export function priceFrom(product: Pick<PublicProduct, "priceRange">): string {
  const { min, max } = product.priceRange;
  return min === max ? formatPrice(min) : `from ${formatPrice(min)}`;
}

/** A short line on delivery and returns for descriptions. */
function servicePromise(policies: ShopPolicies | null): string {
  if (!policies) return "Tracked delivery across India and easy returns.";
  if (alwaysFree(policies)) return "Free delivery across India and easy returns.";
  return `Free delivery over ${formatPrice(policies.freeShippingThreshold)} and easy returns.`;
}

/**
 * The product's own short description, then its price and the shop's
 * promise, within 160 characters (the promise is dropped first if needed).
 */
export function productDescription(
  product: Pick<PublicProduct, "name" | "shortDescription" | "description" | "priceRange">,
  policies: ShopPolicies | null,
): string {
  const own = (product.shortDescription ?? product.description ?? "").trim();
  const lead = own ? (/[.!?]$/.test(own) ? own : `${own}.`) : `${product.name}.`;
  const price = `100% human hair, ${priceFrom(product)}.`;
  const promise = servicePromise(policies);
  for (const text of [`${lead} ${price} ${promise}`, `${lead} ${price}`])
    if (text.length <= DESCRIPTION_MAX) return text;
  return clip(`${lead} ${price}`, DESCRIPTION_MAX);
}

/** "Human Hair Clip-in Extensions in India" (no "Human Hair" twice). */
export function categoryTitle(name: string): string {
  const base = mentionsHumanHair(name) ? name : `Human Hair ${name}`;
  const title = `${base} in India`;
  return title.length <= TITLE_MAX - BRAND_SUFFIX ? title : base;
}

/** The category's own description, then the shop's promise, within 160 characters. */
export function categoryDescription(
  name: string,
  own: string | null,
  policies: ShopPolicies | null,
): string {
  const lead = own?.trim()
    ? /[.!?]$/.test(own.trim())
      ? own.trim()
      : `${own.trim()}.`
    : `Shop ${name.toLowerCase()} in 100% human hair.`;
  const shop = `Shop HairCraft's 100% human hair ${name.toLowerCase()} online.`;
  // The delivery promise goes first if it doesn't fit, so the text ends on a whole sentence.
  for (const text of [`${lead} ${shop} ${servicePromise(policies)}`, `${lead} ${shop}`])
    if (text.length <= DESCRIPTION_MAX) return text;
  return clip(`${lead} ${shop}`, DESCRIPTION_MAX);
}
