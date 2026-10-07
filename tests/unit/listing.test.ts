import { describe, expect, it } from "vitest";
import { findCategory } from "@/lib/api/catalog";
import type { Category } from "@/lib/api/types";
import { ConfigError, parseSettings } from "@/lib/env";
import {
  activeFilters,
  addressOf,
  clearFilters,
  EMPTY_STATE,
  hasFilters,
  isRefinedView,
  listingHref,
  pageNumbers,
  parseListing,
  priceBands,
  slugify,
  toApiQuery,
  toggle,
  withChange,
  type FilterOptions,
  type ListingState,
} from "@/lib/listing/query";

const options: FilterOptions = {
  lengths: [14, 16, 18, 20.5],
  colors: ["Dark Brown", "Natural Black"],
  textures: ["Body Wave", "Straight"],
  price: { min: "3999.00", max: "21999.00" },
};

const state = (patch: Partial<ListingState> = {}): ListingState => ({ ...EMPTY_STATE, ...patch });

describe("reading the address", () => {
  it("reads every filter, the sort and the page", () => {
    expect(
      parseListing(
        {
          length: "18,14",
          color: "natural-black",
          texture: ["body-wave", "straight"],
          min: "4000",
          max: "9000",
          instock: "1",
          sort: "price-asc",
          page: "2",
        },
        options,
      ),
    ).toEqual({
      q: null,
      lengths: [14, 18],
      colors: ["Natural Black"],
      textures: ["Body Wave", "Straight"],
      min: 4000,
      max: 9000,
      inStock: true,
      sort: "price-asc",
      page: 2,
    });
  });

  it("drops anything unknown or malformed instead of failing", () => {
    expect(
      parseListing(
        {
          length: "99,abc,18",
          color: "purple",
          texture: "<script>",
          min: "-5",
          max: "12e3",
          instock: "yes",
          sort: "cheapest",
          page: "0",
          other: "x",
        },
        options,
      ),
    ).toEqual(state({ lengths: [18] }));
    expect(parseListing({ page: "99999" }, options).page).toBe(1);
    expect(parseListing({ length: "20.5" }, options).lengths).toEqual([20.5]);
  });

  it("swaps a price range given back to front, and treats a minimum of 0 as none", () => {
    expect(parseListing({ min: "9000", max: "4000" }, options)).toMatchObject({
      min: 4000,
      max: 9000,
    });
    expect(parseListing({ min: "0", max: "5000" }, options)).toMatchObject({
      min: null,
      max: 5000,
    });
  });
});

describe("building the address", () => {
  it("uses a fixed order and leaves defaults out, so one view has one address", () => {
    const view = state({
      textures: ["Body Wave"],
      lengths: [18, 20.5],
      colors: ["Natural Black"],
      min: 4000,
      inStock: true,
      sort: "rating",
      page: 3,
    });
    expect(listingHref("/shop/wigs", view)).toBe(
      "/shop/wigs?length=18,20.5&color=natural-black&texture=body-wave&min=4000&instock=1&sort=rating&page=3",
    );
    expect(listingHref("/shop", EMPTY_STATE)).toBe("/shop");
  });

  it("round-trips: reading a built address gives the same state", () => {
    const view = state({ lengths: [14], colors: ["Dark Brown"], max: 8000, sort: "name", page: 2 });
    const href = listingHref("/shop", view);
    const params = Object.fromEntries(new URLSearchParams(href.split("?")[1]));
    expect(parseListing(params, options)).toEqual(view);
  });

  it("spells the requested address the same way, to spot untidy ones", () => {
    const tidy = state({ lengths: [18, 20.5], colors: ["Natural Black"] });
    expect(addressOf("/shop", { length: "18,20.5", color: "natural-black" })).toBe(
      listingHref("/shop", tidy),
    );
    // The plain form's repeated keys and empty boxes are untidy.
    expect(addressOf("/shop", { length: ["18", "20.5"], min: "" })).not.toBe(
      listingHref("/shop", state({ lengths: [18, 20.5] })),
    );
    expect(addressOf("/shop", { page: "1" })).not.toBe("/shop");
    expect(addressOf("/shop", {})).toBe("/shop");
  });

  it("goes back to page 1 on any change but the page", () => {
    const onPage3 = state({ page: 3 });
    expect(withChange(onPage3, { inStock: true }).page).toBe(1);
    expect(withChange(onPage3, { page: 4 }).page).toBe(4);
  });

  it("ticks and unticks list values", () => {
    expect(toggle([18], 20)).toEqual([18, 20]);
    expect(toggle([18, 20], 18)).toEqual([20]);
  });

  it("turns names into address-friendly words", () => {
    expect(slugify("Natural Black")).toBe("natural-black");
    expect(slugify("  Café  Crème #2 ")).toBe("cafe-creme-2");
  });
});

describe("the API query", () => {
  it("sends only what is set, with the API's sort", () => {
    expect(
      toApiQuery(state({ colors: ["Natural Black"], sort: "price-desc" }), 24, "wigs"),
    ).toEqual({
      category: "wigs",
      length: undefined,
      color: ["Natural Black"],
      texture: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      sort: "price:desc",
      page: 1,
      limit: 24,
    });
    expect(toApiQuery(EMPTY_STATE, 12).sort).toBe("createdAt:desc");
  });
});

describe("price bands", () => {
  it("makes up to three round bands from the real range", () => {
    expect(priceBands(options.price)).toEqual([
      { label: "Up to ₹10,000", min: null, max: 10000 },
      { label: "₹10,000 – ₹16,000", min: 10000, max: 16000 },
      { label: "From ₹16,000", min: 16000, max: null },
    ]);
    expect(priceBands({ min: "4999.00", max: "6999.00" }).map((b) => b.label)).toEqual([
      "Up to ₹5,500",
      "₹5,500 – ₹6,500",
      "From ₹6,500",
    ]);
  });

  it("offers none for a missing or narrow range", () => {
    expect(priceBands(null)).toEqual([]);
    expect(priceBands({ min: "4999.00", max: "5499.00" })).toEqual([]);
  });
});

describe("active filters", () => {
  it("gives one chip per filter, each removing only itself", () => {
    const view = state({
      lengths: [18, 20.5],
      colors: ["Natural Black"],
      min: 4000,
      inStock: true,
      page: 2,
    });
    const chips = activeFilters(view);
    expect(chips.map((c) => c.label)).toEqual([
      "Length: 18 inch",
      "Length: 20.5 inch",
      "Colour: Natural Black",
      "Price: From ₹4,000",
      "In stock only",
    ]);
    expect(chips[0].without).toEqual({ ...view, lengths: [20.5], page: 1 });
    expect(chips[3].without).toMatchObject({ min: null, max: null });
  });

  it("clears every filter but keeps the sort", () => {
    const view = state({ lengths: [18], sort: "rating", page: 2 });
    expect(clearFilters(view)).toEqual(state({ sort: "rating" }));
    expect(hasFilters(clearFilters(view))).toBe(false);
  });

  it("knows which views search engines shouldn't index", () => {
    expect(isRefinedView(EMPTY_STATE)).toBe(false);
    expect(isRefinedView(state({ page: 4 }))).toBe(false);
    expect(isRefinedView(state({ sort: "name" }))).toBe(true);
    expect(isRefinedView(state({ inStock: true }))).toBe(true);
  });
});

describe("page numbers", () => {
  it("shows the first, last, current and neighbours, with gaps", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
    expect(pageNumbers(1, 3)).toEqual([1, 2, 3]);
    expect(pageNumbers(1, 6)).toEqual([1, 2, null, 6]);
    expect(pageNumbers(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    // A gap of one page shows that page rather than "…".
    expect(pageNumbers(4, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
  });
});

describe("categories", () => {
  const tree: Category[] = [
    {
      id: "1",
      name: "Clip-ins",
      slug: "clip-ins",
      description: null,
      productCount: 2,
      children: [
        {
          id: "2",
          name: "Seamless",
          slug: "seamless",
          description: null,
          productCount: 1,
          children: [],
        },
      ],
    },
  ];

  it("finds a category at any depth, with the categories above it", () => {
    expect(findCategory(tree, "clip-ins")).toMatchObject({
      category: { name: "Clip-ins" },
      ancestors: [],
    });
    expect(findCategory(tree, "seamless")).toMatchObject({
      category: { name: "Seamless" },
      ancestors: [{ name: "Clip-ins" }],
    });
    expect(findCategory(tree, "nope")).toBeNull();
  });
});

describe("PRODUCTS_PER_PAGE setting", () => {
  it("defaults to 24 and accepts 1 to 100", () => {
    expect(parseSettings({}).productsPerPage).toBe(24);
    expect(parseSettings({ PRODUCTS_PER_PAGE: "2" }).productsPerPage).toBe(2);
    for (const bad of ["0", "101", "12.5", "lots"])
      expect(() => parseSettings({ PRODUCTS_PER_PAGE: bad })).toThrow(ConfigError);
  });
});
