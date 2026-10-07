/**
 * The product listing's state lives in the address, e.g.
 * `/shop/wigs?length=18,22&color=natural-black&min=4000&sort=price-asc&page=2`,
 * so a view can be shared, bookmarked and stepped through with Back.
 *
 * Pure (no React, no server code), so the rules are unit-tested. Anything
 * malformed or unknown in an address is dropped here and never reaches the
 * API, so a hand-edited or outdated link shows products, not an error.
 */
import { formatPrice } from "@/lib/format";

export const SORTS = [
  { key: "relevance", label: "Relevance", api: "relevance:desc" },
  { key: "newest", label: "Newest", api: "createdAt:desc" },
  { key: "price-asc", label: "Price: low to high", api: "price:asc" },
  { key: "price-desc", label: "Price: high to low", api: "price:desc" },
  { key: "rating", label: "Best rated", api: "rating:desc" },
  { key: "name", label: "Name A–Z", api: "name:asc" },
] as const;

export type SortKey = (typeof SORTS)[number]["key"];
/** The order of a plain list (a search defaults to relevance instead). */
export const DEFAULT_SORT: SortKey = "newest";

/** Searches are sorted by relevance unless asked otherwise; plain lists newest first. */
export function defaultSort(state: { q: string | null }): SortKey {
  return state.q !== null ? "relevance" : DEFAULT_SORT;
}

/** The sorts to offer: Relevance only when searching. */
export function sortsFor(state: { q: string | null }) {
  return SORTS.filter((sort) => sort.key !== "relevance" || state.q !== null);
}

/** Fewer letters than this get no type-ahead suggestions (too vague, and it saves requests). */
export const MIN_SUGGEST_LENGTH = 2;

/** At most this many characters of a search are used (the API's own limit). */
export const MAX_SEARCH_LENGTH = 100;

/** A search as typed, tidied: trimmed, single spaces, at most 100 characters; `null` if empty. */
export function cleanSearch(text: string | undefined): string | null {
  const q = (text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH).trim();
  return q === "" ? null : q;
}

/** What the filters can offer (from `GET /products/filters`). */
export interface FilterOptions {
  lengths: number[];
  colors: string[];
  textures: string[];
  price: { min: string; max: string } | null;
}

export interface ListingState {
  /** The search words on `/search` (null on the shop's lists). */
  q: string | null;
  lengths: number[];
  /** Colour and texture names exactly as the API spells them. */
  colors: string[];
  textures: string[];
  /** Whole rupees. */
  min: number | null;
  max: number | null;
  inStock: boolean;
  sort: SortKey;
  page: number;
}

export type SearchParams = Record<string, string | string[] | undefined>;

export const EMPTY_STATE: ListingState = {
  q: null,
  lengths: [],
  colors: [],
  textures: [],
  min: null,
  max: null,
  inStock: false,
  sort: DEFAULT_SORT,
  page: 1,
};

/** "Natural Black" → "natural-black" (how names appear in addresses). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every value given for a key: repeated keys (`a=1&a=2`) and commas (`a=1,2`) both count. */
function values(params: SearchParams, key: string): string[] {
  const raw = params[key];
  const list = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  return list
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

/** The first value of a key, if any. */
function single(params: SearchParams, key: string): string | undefined {
  return values(params, key)[0];
}

const RUPEES = /^\d{1,7}$/;

/** Keeps only the options that were asked for, in the options' own order (so addresses are stable). */
function pick<T>(options: T[], wanted: Set<string>, key: (option: T) => string): T[] {
  return options.filter((option) => wanted.has(key(option)));
}

/** Reads the listing state from an address, checked against what the filters offer. */
export function parseListing(params: SearchParams, options: FilterOptions): ListingState {
  const lengths = pick(options.lengths, new Set(values(params, "length")), String);
  const colors = pick(options.colors, new Set(values(params, "color")), slugify);
  const textures = pick(options.textures, new Set(values(params, "texture")), slugify);

  const rupees = (key: string) => {
    const value = single(params, key);
    return value !== undefined && RUPEES.test(value) ? Number(value) : null;
  };
  let min = rupees("min");
  let max = rupees("max");
  // "from 6000 to 4000" is read as 4000 to 6000.
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  if (min === 0) min = null;

  // The search is read whole: it may contain commas.
  const rawQ = params.q;
  const q = cleanSearch(Array.isArray(rawQ) ? rawQ[0] : rawQ);

  const sortValue = single(params, "sort");
  const sort =
    sortsFor({ q }).find((option) => option.key === sortValue)?.key ?? defaultSort({ q });

  const pageValue = single(params, "page");
  const page = pageValue && /^\d{1,4}$/.test(pageValue) ? Math.max(1, Number(pageValue)) : 1;

  return {
    q,
    lengths,
    colors,
    textures,
    min,
    max,
    inStock: single(params, "instock") === "1",
    sort,
    page,
  };
}

/**
 * The address for a state: keys in a fixed order, defaults left out, so the
 * same view always has the same address.
 */
export function listingHref(base: string, state: ListingState): string {
  const parts: string[] = [];
  const add = (key: string, list: (string | number)[]) => {
    if (list.length > 0) parts.push(`${key}=${list.map((v) => encodeURIComponent(v)).join(",")}`);
  };
  if (state.q !== null) parts.push(`q=${encodeURIComponent(state.q)}`);
  add("length", state.lengths);
  add("color", state.colors.map(slugify));
  add("texture", state.textures.map(slugify));
  if (state.min !== null) add("min", [state.min]);
  if (state.max !== null) add("max", [state.max]);
  if (state.inStock) add("instock", [1]);
  if (state.sort !== defaultSort(state)) add("sort", [state.sort]);
  if (state.page > 1) add("page", [state.page]);
  return parts.length > 0 ? `${base}?${parts.join("&")}` : base;
}

/** The address as requested, spelled the way `listingHref` spells addresses (to compare the two). */
export function addressOf(base: string, params: SearchParams): string {
  const parts = Object.entries(params).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value ?? ""]).map(
      (v) =>
        `${encodeURIComponent(key)}=${
          // The search is one value (commas included); lists keep their commas.
          key === "q" ? encodeURIComponent(v) : v.split(",").map(encodeURIComponent).join(",")
        }`,
    ),
  );
  return parts.length > 0 ? `${base}?${parts.join("&")}` : base;
}

/** A changed state; any change other than the page goes back to page 1. */
export function withChange(state: ListingState, change: Partial<ListingState>): ListingState {
  return { ...state, page: 1, ...change };
}

/** Adds or removes one value of a list filter (a tick box). */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Any filter is set (the page and sort don't count). */
export function hasFilters(state: ListingState): boolean {
  return (
    state.lengths.length > 0 ||
    state.colors.length > 0 ||
    state.textures.length > 0 ||
    state.min !== null ||
    state.max !== null ||
    state.inStock
  );
}

/** A view search engines shouldn't index on its own: a search, filtered or re-sorted. */
export function isRefinedView(state: ListingState): boolean {
  return state.q !== null || hasFilters(state) || state.sort !== defaultSort(state);
}

/** The API query for a state. */
export function toApiQuery(state: ListingState, perPage: number, category?: string) {
  return {
    category,
    search: state.q ?? undefined,
    length: state.lengths.length > 0 ? state.lengths : undefined,
    color: state.colors.length > 0 ? state.colors : undefined,
    texture: state.textures.length > 0 ? state.textures : undefined,
    minPrice: state.min ?? undefined,
    maxPrice: state.max ?? undefined,
    inStock: state.inStock || undefined,
    sort: SORTS.find((option) => option.key === state.sort)?.api,
    page: state.page,
    limit: perPage,
  };
}

const rupeeLabel = (amount: number) => formatPrice(String(amount));

/** "Up to ₹4,000", "₹4,000 – ₹6,000", "From ₹6,000", "18 inch" … */
export function priceLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${rupeeLabel(min)} – ${rupeeLabel(max)}`;
  if (max !== null) return `Up to ${rupeeLabel(max)}`;
  return `From ${rupeeLabel(min ?? 0)}`;
}

export const lengthLabel = (inches: number) => `${inches} inch`;

export interface PriceBand {
  label: string;
  min: number | null;
  max: number | null;
}

/**
 * Up to three price bands with round edges, from the real price range, e.g.
 * ₹3,999–₹21,999 → Up to ₹10,000 · ₹10,000 – ₹16,000 · From ₹16,000.
 * A narrow range (under ₹1,000 wide) gets no bands.
 */
export function priceBands(range: FilterOptions["price"]): PriceBand[] {
  if (!range) return [];
  const low = Math.floor(Number(range.min));
  const high = Math.ceil(Number(range.max));
  if (!(high - low >= 1000)) return [];
  const step = (high - low) / 3;
  const unit = step >= 1000 ? 1000 : 500;
  const round = (value: number) => Math.round(value / unit) * unit;
  const first = round(low + step);
  const second = round(low + 2 * step);
  // Edges strictly inside the range, rising; rounding may merge or drop one.
  const edges = [first, second].filter(
    (edge, i) => edge > low && edge < high && (i === 0 || edge > first),
  );
  if (edges.length === 0) return [];
  const bands: PriceBand[] = [{ label: priceLabel(null, edges[0]), min: null, max: edges[0] }];
  if (edges.length === 2)
    bands.push({ label: priceLabel(edges[0], edges[1]), min: edges[0], max: edges[1] });
  const last = edges[edges.length - 1];
  bands.push({ label: priceLabel(last, null), min: last, max: null });
  return bands;
}

export interface ActiveFilter {
  /** e.g. "Colour: Natural Black", for the chip and its "Remove …" label. */
  label: string;
  /** The state without this filter. */
  without: ListingState;
}

/** One removable chip per active filter, in the order the filters are shown. */
export function activeFilters(state: ListingState): ActiveFilter[] {
  const chips: ActiveFilter[] = [];
  for (const length of state.lengths)
    chips.push({
      label: `Length: ${lengthLabel(length)}`,
      without: withChange(state, { lengths: state.lengths.filter((l) => l !== length) }),
    });
  for (const color of state.colors)
    chips.push({
      label: `Colour: ${color}`,
      without: withChange(state, { colors: state.colors.filter((c) => c !== color) }),
    });
  for (const texture of state.textures)
    chips.push({
      label: `Texture: ${texture}`,
      without: withChange(state, { textures: state.textures.filter((t) => t !== texture) }),
    });
  if (state.min !== null || state.max !== null)
    chips.push({
      label: `Price: ${priceLabel(state.min, state.max)}`,
      without: withChange(state, { min: null, max: null }),
    });
  if (state.inStock)
    chips.push({ label: "In stock only", without: withChange(state, { inStock: false }) });
  return chips;
}

/** Every filter cleared; the search and the sort are kept. */
export function clearFilters(state: ListingState): ListingState {
  return { ...EMPTY_STATE, q: state.q, sort: state.sort };
}

/** Page numbers to show: always the first and last, the current one and its neighbours; `null` = a gap. */
export function pageNumbers(current: number, total: number): (number | null)[] {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  pages.forEach((page, i) => {
    if (i > 0 && page - pages[i - 1] > 1) out.push(page - pages[i - 1] === 2 ? page - 1 : null);
    out.push(page);
  });
  return out;
}
