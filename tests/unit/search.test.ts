import { describe, expect, it } from "vitest";
import {
  activeFilters,
  addressOf,
  cleanSearch,
  clearFilters,
  defaultSort,
  EMPTY_STATE,
  isRefinedView,
  listingHref,
  parseListing,
  sortsFor,
  toApiQuery,
  type FilterOptions,
  type ListingState,
} from "@/lib/listing/query";
import { highlight } from "@/lib/search/highlight";

const options: FilterOptions = {
  lengths: [18, 20],
  colors: ["Natural Black"],
  textures: ["Body Wave"],
  price: { min: "3999.00", max: "9999.00" },
};
const state = (patch: Partial<ListingState> = {}): ListingState => ({ ...EMPTY_STATE, ...patch });

describe("search words in the address", () => {
  it("tidies what was typed: trimmed, single spaces, at most 100 characters", () => {
    expect(cleanSearch("  body   wave \n clip ")).toBe("body wave clip");
    expect(cleanSearch("   ")).toBeNull();
    expect(cleanSearch(undefined)).toBeNull();
    expect(cleanSearch("x".repeat(150))).toHaveLength(100);
  });

  it("reads the search whole (commas included) and defaults to relevance", () => {
    const parsed = parseListing({ q: "wig, body wave", length: "18" }, options);
    expect(parsed).toMatchObject({ q: "wig, body wave", lengths: [18], sort: "relevance" });
    expect(parseListing({ q: ["first", "second"] }, options).q).toBe("first");
  });

  it("offers Relevance only when searching", () => {
    expect(sortsFor({ q: "wig" }).map((s) => s.key)).toContain("relevance");
    expect(sortsFor({ q: null }).map((s) => s.key)).not.toContain("relevance");
    // A relevance sort without a search falls back to newest.
    expect(parseListing({ sort: "relevance" }, options).sort).toBe("newest");
    expect(defaultSort({ q: "wig" })).toBe("relevance");
    expect(defaultSort({ q: null })).toBe("newest");
  });

  it("puts the search first in the address, and leaves out the default sort", () => {
    expect(listingHref("/search", state({ q: "body wave", sort: "relevance" }))).toBe(
      "/search?q=body%20wave",
    );
    expect(listingHref("/search", state({ q: "wig, lace", lengths: [18], sort: "newest" }))).toBe(
      "/search?q=wig%2C%20lace&length=18&sort=newest",
    );
  });

  it("spells a requested search the same way (so a form's `+` isn't a redirect)", () => {
    const view = state({ q: "wig, lace", sort: "relevance" });
    // URLSearchParams decodes `+` and `%2C`: the page receives the plain text.
    expect(addressOf("/search", { q: "wig, lace" })).toBe(listingHref("/search", view));
  });

  it("round-trips through the address", () => {
    const view = state({
      q: "natural black 18",
      textures: ["Body Wave"],
      sort: "price-asc",
      page: 2,
    });
    const href = listingHref("/search", view);
    const params = Object.fromEntries(new URLSearchParams(href.split("?")[1]));
    expect(parseListing(params, options)).toEqual(view);
  });

  it("sends the search to the API; Clear all keeps it", () => {
    expect(toApiQuery(state({ q: "wig", sort: "relevance" }), 24)).toMatchObject({
      search: "wig",
      sort: "relevance:desc",
    });
    expect(toApiQuery(EMPTY_STATE, 24).search).toBeUndefined();
    const filtered = state({ q: "wig", lengths: [18], sort: "rating" });
    expect(clearFilters(filtered)).toEqual(state({ q: "wig", sort: "rating" }));
    // The search itself isn't a removable filter chip (it has its own box).
    expect(activeFilters(filtered).map((c) => c.label)).toEqual(["Length: 18 inch"]);
  });

  it("search pages are never indexed", () => {
    expect(isRefinedView(state({ q: "wig", sort: "relevance" }))).toBe(true);
  });
});

describe("highlighting matched words", () => {
  const bold = (text: string, query: string) =>
    highlight(text, query)
      .map((part) => (part.match ? `[${part.text}]` : part.text))
      .join("");

  it("marks every searched word, whatever the case", () => {
    expect(bold("Brazilian Body Wave Seamless Clip-in", "wave CLIP")).toBe(
      "Brazilian Body [Wave] Seamless [Clip]-in",
    );
    expect(bold("Body Wave", "body wa")).toBe("[Body] [Wa]ve");
  });

  it("prefers the longer word, ignores one-letter words and special characters", () => {
    expect(bold("Wavy Wave", "wav wave")).toBe("[Wav]y [Wave]");
    expect(bold("A wig", "a")).toBe("A wig");
    expect(bold("Price (₹) [sale]", "(₹) [s")).toBe("Price (₹) [sale]");
    expect(highlight("", "wig")).toEqual([]);
  });
});
