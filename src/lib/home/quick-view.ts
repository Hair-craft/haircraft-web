"use server";

import { getProduct } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { PublicProduct } from "@/lib/api/types";
import { descriptionHtml } from "@/lib/product/description-html";
import { defaultVariant } from "@/lib/product/variants";

export type QuickViewResult =
  | { ok: true; product: PublicProduct; initialSku: string; descriptionHtml: string | null }
  | { ok: false; message: string };

const SLUG = /^[a-z0-9][a-z0-9-]{0,199}$/i;

/**
 * A product for the home page's quick view (owner, 2026-11-23): the same data
 * the product page shows, fetched when a Best sellers column is opened, so
 * the shopper never leaves the home page.
 */
export async function quickView(slug: string): Promise<QuickViewResult> {
  if (typeof slug !== "string" || !SLUG.test(slug))
    return { ok: false, message: "This product isn't available." };
  try {
    const product = await getProduct(slug);
    return {
      ok: true,
      product,
      initialSku: defaultVariant(product.variants)?.sku ?? "",
      descriptionHtml: descriptionHtml(product.description),
    };
  } catch (error) {
    if (isApiError(error) && error.status === 404)
      return { ok: false, message: "This product isn't available any more." };
    if (isApiError(error))
      return { ok: false, message: "We couldn't load this product just now. Please try again." };
    throw error;
  }
}
