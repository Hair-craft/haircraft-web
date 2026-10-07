/** The API's response envelope and the catalogue shapes the storefront uses. */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta: PaginationMeta | null;
}

export interface FieldError {
  field: string;
  messages: string[];
}

export interface ErrorEnvelope {
  success: false;
  code: string;
  message: string;
  errors: FieldError[];
  data: unknown;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Amounts are decimal strings in rupees, e.g. `"18397.00"`; never compute with them as floats. */
export type Money = string;

export interface ImageUrls {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  children: Category[];
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  image: ImageUrls | null;
  imageAlt: string | null;
  priceRange: { min: Money; max: Money };
  onSale: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

/** An approved review, as the storefront may show it (first name and initial only). */
/** A customer's photo on a review. */
export interface ReviewPhoto {
  id: string;
  urls: ImageUrls;
  width: number;
  height: number;
}

export interface PublicReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewerName: string;
  verifiedPurchase: boolean;
  photos: ReviewPhoto[];
  createdAt: string;
}

/** `GET /products/suggest`: what a search box suggests while the shopper types. */
export interface SearchSuggestions {
  /** Up to 5, most relevant first. */
  products: ProductCard[];
  /** Up to 3 categories whose names contain every word. */
  categories: { id: string; name: string; slug: string }[];
  /** When nothing matches: the search with misspelt words corrected, if that finds products. */
  didYouMean: string | null;
}

/** A product photo (`GET /products/:slug`); `variantId` set when it shows one option. */
export interface ProductImage {
  id: string;
  urls: ImageUrls;
  altText: string | null;
  variantId: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

/** One buyable option of a product: a length, colour and texture at a price. */
export interface PublicVariant {
  id: string;
  sku: string;
  price: Money;
  salePrice: Money | null;
  /** The price paid: the sale price when on sale. */
  effectivePrice: Money;
  onSale: boolean;
  lengthInches: number | null;
  color: string | null;
  texture: string | null;
  weightGrams: number | null;
  attributes: Record<string, string>;
  inStock: boolean;
}

/** `GET /products/:slug`: everything the product page needs. */
export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  attributes: Record<string, string>;
  categories: { id: string; name: string; slug: string }[];
  images: ProductImage[];
  variants: PublicVariant[];
  options: { lengths: number[]; colors: string[]; textures: string[]; weights: number[] };
  priceRange: { min: Money; max: Money };
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

/** `GET /products/:slug/reviews/summary`. */
export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
}
