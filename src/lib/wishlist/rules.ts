/**
 * Wishlist rules that need no server or browser, so they are unit-tested.
 */
import type { ProductCard, PublicVariant } from "@/lib/api/types";

/** The API's limit (backend `wishlist.service.ts`). */
export const MAX_WISHLIST_ITEMS = 200;

/** One saved product, as `GET /wishlist` returns it. */
export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  /** False when the product is no longer sold (then `product` is null). */
  available: boolean;
  product: ProductCard | null;
  addedAt: string;
}

export interface Wishlist {
  items: WishlistItem[];
  count: number;
}

/**
 * "Move to bag" for a saved product (which has no option chosen):
 * - `direct`: only one option is in stock, so that one goes in the bag
 * - `choose`: several are, so the shopper picks on the product page
 * - `soldout`: none is
 */
export type MovePlan =
  { kind: "direct"; variantId: string; price: string } | { kind: "choose" } | { kind: "soldout" };

export function movePlan(
  variants: Pick<PublicVariant, "id" | "inStock" | "effectivePrice">[],
): MovePlan {
  const inStock = variants.filter((v) => v.inStock);
  if (inStock.length === 0) return { kind: "soldout" };
  if (inStock.length === 1)
    return { kind: "direct", variantId: inStock[0].id, price: inStock[0].effectivePrice };
  return { kind: "choose" };
}

/** What the heart says to screen readers (its pressed state is announced too). */
export function heartLabel(name: string, saved: boolean): string {
  return saved ? `Remove ${name} from your wishlist` : `Save ${name} to your wishlist`;
}

/** The API's refusals in the shop's words. */
export function wishlistErrorMessage(status: number, code: string): string {
  switch (code) {
    case "WISHLIST_LIMIT_REACHED":
      return `Your wishlist can hold up to ${MAX_WISHLIST_ITEMS} products. Remove some first.`;
    case "PRODUCT_UNAVAILABLE":
      return "This product is no longer available.";
  }
  if (status === 401) return "Your session has ended. Please sign in again.";
  if (status === 0 || status >= 500)
    return "We can't reach the shop at the moment. Please try again in a minute.";
  return "That didn't work. Please try again.";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A product id as kept in the "save after signing in" cookie (anything else is ignored). */
export function pendingSaveId(value: string | undefined): string | null {
  return value && UUID.test(value) ? value.toLowerCase() : null;
}
