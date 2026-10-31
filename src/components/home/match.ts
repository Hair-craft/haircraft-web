/**
 * The home page's "Find your match": the shopper picks a goal (a category),
 * a texture and a shade, and is shown a real product that matches. Pure, so
 * the rules are unit-tested; `/bff/match` runs the searches.
 */
import { slugify } from "@/lib/listing/query";

export interface MatchChoice {
  /** A category slug (null: the whole shop). */
  category: string | null;
  /** Names exactly as the API spells them. */
  texture: string | null;
  color: string | null;
}

/**
 * The searches to try, strictest first: everything chosen, then without the
 * shade, then without the texture, then the category alone. The first that
 * finds a product is the match (exact only if it was the first).
 */
export function matchSteps(choice: MatchChoice): MatchChoice[] {
  const steps: MatchChoice[] = [
    choice,
    { ...choice, color: null },
    { ...choice, texture: null },
    { ...choice, texture: null, color: null },
  ];
  const seen = new Set<string>();
  return steps.filter((step) => {
    const key = JSON.stringify(step);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The shop's address for a choice, with its filters set (spelled as the listing spells them). */
export function matchShopHref(choice: MatchChoice): string {
  const base = choice.category ? `/shop/${encodeURIComponent(choice.category)}` : "/shop";
  const params = [
    choice.color ? `color=${encodeURIComponent(slugify(choice.color))}` : null,
    choice.texture ? `texture=${encodeURIComponent(slugify(choice.texture))}` : null,
  ].filter(Boolean);
  return params.length > 0 ? `${base}?${params.join("&")}` : base;
}

/** The `/bff/match` address for a choice. */
export function matchApiHref(choice: MatchChoice): string {
  const params = new URLSearchParams();
  if (choice.category) params.set("category", choice.category);
  if (choice.texture) params.set("texture", choice.texture);
  if (choice.color) params.set("color", choice.color);
  const query = params.toString();
  return query ? `/bff/match?${query}` : "/bff/match";
}

/** Swatch colours for common shade words; anything else gets a neutral dot. */
const SWATCHES: [RegExp, string][] = [
  [/highlight|balayage|ombre|ombré|streak|mix/i, "linear-gradient(45deg,#3b2317,#a3683b,#c99a5b)"],
  [/jet|off.?black|natural black|black/i, "#151312"],
  [/dark brown|espresso|chocolate/i, "#2c1f1d"],
  [/chestnut|auburn|copper/i, "#6b3a22"],
  [/burgundy|wine|red/i, "#5b1a24"],
  [/caramel|honey/i, "#a3683b"],
  [/blonde|golden|gold/i, "#c99a5b"],
  [/grey|gray|silver/i, "#9a9a9a"],
  [/white|platinum/i, "#ece7df"],
  [/brown/i, "#4e2b1e"],
];

export function swatchFor(color: string): string {
  return SWATCHES.find(([pattern]) => pattern.test(color))?.[1] ?? "#d9cfc0";
}
