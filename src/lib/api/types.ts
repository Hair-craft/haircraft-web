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
