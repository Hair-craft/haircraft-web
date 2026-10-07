import "server-only";
import { settings } from "@/lib/env";
import { apiFetch, apiFetchPage, type QueryValue } from "./client";
import type { FilterOptions } from "@/lib/listing/query";
import type {
  Category,
  Paginated,
  ProductCard,
  PublicProduct,
  PublicReview,
  ReviewSummary,
  SearchSuggestions,
} from "./types";

/** Categories change rarely; the menu is refreshed every 5 minutes. */
export const CATEGORY_REVALIDATE_SECONDS = 300;
/** Product lists (new arrivals, ratings) are refreshed every 2 minutes. */
export const PRODUCT_LIST_REVALIDATE_SECONDS = 120;

/** Active categories as a tree (top level with children). */
export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories", {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["categories"],
  });
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  /** e.g. `createdAt:desc`, `rating:desc`, `price:asc`. */
  sort?: string;
  /** Category slug (includes its sub-categories). */
  category?: string;
  search?: string;
  inStock?: boolean;
  [key: string]: QueryValue;
}

/** Active products as cards (public, cached briefly). */
export function getProducts(query: ProductListQuery = {}): Promise<Paginated<ProductCard>> {
  return apiFetchPage<ProductCard>("/products", {
    query,
    revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
    tags: ["products"],
  });
}

/** What the listing filters can offer in a category (or the whole shop); refreshed every 5 minutes. */
export function getFilterOptions(category?: string, search?: string): Promise<FilterOptions> {
  return apiFetch<FilterOptions>("/products/filters", {
    query: { category, search },
    revalidate: search ? SUGGESTION_REVALIDATE_SECONDS : CATEGORY_REVALIDATE_SECONDS,
    tags: ["products"],
  });
}

/** Each search's suggestions are kept for a minute, so retyping costs the API nothing. */
export const SUGGESTION_REVALIDATE_SECONDS = 60;

/** Type-ahead suggestions for a search box (products, categories, "did you mean"). */
export function getSuggestions(q: string): Promise<SearchSuggestions> {
  return apiFetch<SearchSuggestions>("/products/suggest", {
    query: { q },
    revalidate: SUGGESTION_REVALIDATE_SECONDS,
    tags: ["products"],
  });
}

/** A category and the chain of categories above it (top level first), or null if there is none by that slug. */
export function findCategory(
  tree: Category[],
  slug: string,
): { category: Category; ancestors: Category[] } | null {
  for (const node of tree) {
    if (node.slug === slug) return { category: node, ancestors: [] };
    const found = findCategory(node.children, slug);
    if (found) return { category: found.category, ancestors: [node, ...found.ancestors] };
  }
  return null;
}

/** The newest products, newest first. */
export async function getNewArrivals(limit = 8): Promise<ProductCard[]> {
  return (await getProducts({ sort: "createdAt:desc", limit })).items;
}

/** Products that have reviews, highest rated first (empty when nothing is reviewed yet). */
export async function getBestRated(limit = 8): Promise<ProductCard[]> {
  const { items } = await getProducts({ sort: "rating:desc", limit: Math.min(limit * 2, 50) });
  return bestRatedOnly(items).slice(0, limit);
}

/** Only products somebody has reviewed: a 0-star "rating" means "no reviews yet". */
export function bestRatedOnly(products: ProductCard[]): ProductCard[] {
  return products.filter((product) => product.reviewCount > 0);
}

/** A photo to represent a category: its newest product that has one. */
export async function getCategoryPhoto(slug: string): Promise<ProductCard | null> {
  const { items } = await getProducts({ category: slug, sort: "createdAt:desc", limit: 6 });
  return items.find((product) => product.image !== null) ?? null;
}

/** A featured review (home page): an approved review with the product it is about. */
export interface FeaturedReview {
  review: PublicReview;
  product: { id: string; name: string; slug: string };
}

/**
 * The shop's most relevant reviews (the API picks them: approved 5-star
 * reviews that say something, one per product, with photos first, then
 * verified purchases, then the newest). Empty when there are none.
 */
export function getFeaturedReviews(limit = 3): Promise<FeaturedReview[]> {
  return apiFetch<FeaturedReview[]>("/reviews/featured", {
    query: { limit },
    revalidate: reviewsCache(),
    tags: ["reviews"],
  });
}

/** One active product by slug (an unknown or hidden one is an `ApiError` with status 404). */
export function getProduct(slug: string): Promise<PublicProduct> {
  return apiFetch<PublicProduct>(`/products/${encodeURIComponent(slug)}`, {
    revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
    tags: ["products", `product:${slug}`],
  });
}

export const REVIEW_SORTS = ["relevant", "newest", "highest", "lowest"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];
/** Approved reviews' cache time (0: always fresh, as in the end-to-end tests). */
const reviewsCache = () => {
  const seconds = settings().reviewsCacheSeconds;
  return seconds > 0 ? seconds : undefined;
};

/** Reviews shown at a time on the product page. */
export const REVIEWS_PER_PAGE = 5;

/** A page of a product's approved reviews. */
export function getReviewPage(
  slug: string,
  sort: ReviewSort = "relevant",
  page = 1,
): Promise<Paginated<PublicReview>> {
  return apiFetchPage<PublicReview>(`/products/${encodeURIComponent(slug)}/reviews`, {
    query: { sort, page, limit: REVIEWS_PER_PAGE },
    revalidate: reviewsCache(),
    tags: ["reviews"],
  });
}

/** Average, count and 1–5 breakdown of a product's approved reviews. */
export function getReviewSummary(slug: string): Promise<ReviewSummary> {
  return apiFetch<ReviewSummary>(`/products/${encodeURIComponent(slug)}/reviews/summary`, {
    revalidate: reviewsCache(),
    tags: ["reviews"],
  });
}
