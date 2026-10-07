"use server";

import { redirect } from "next/navigation";
import { getProduct } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { changeCart, cartProblemCode, CART_PROBLEMS } from "@/lib/cart/server";
import type { Cart } from "@/lib/cart/rules";
import { safeNext } from "@/lib/session/rules";
import { movePlan, wishlistErrorMessage } from "./rules";
import {
  accessToken,
  getWishlist,
  rememberPendingSave,
  rememberWishlistCount,
  removeProduct,
  saveProduct,
} from "./server";

export interface WishlistResult {
  /** The saved product ids afterwards (null when unknown). */
  savedIds: string[] | null;
  count: number | null;
  error: string | null;
  /** A guest: they're asked to sign in (the product is kept to save afterwards). */
  signInNeeded?: boolean;
}

const ids = (w: { items: { productId: string }[] }) => w.items.map((i) => i.productId);

/** The saved product ids (to fill the hearts on a page), or nothing for a guest. */
export async function loadSavedIdsAction(): Promise<WishlistResult> {
  const token = await accessToken();
  if (!token) return { savedIds: [], count: 0, error: null };
  try {
    const wishlist = await getWishlist(token);
    return { savedIds: ids(wishlist), count: wishlist.count, error: null };
  } catch (error) {
    if (!isApiError(error)) throw error;
    return { savedIds: null, count: null, error: null };
  }
}

/** Saves or removes a product (the heart). A guest is asked to sign in first. */
export async function toggleSaveAction(productId: string, save: boolean): Promise<WishlistResult> {
  const token = await accessToken();
  if (!token) {
    if (save) await rememberPendingSave(String(productId));
    return { savedIds: null, count: null, error: null, signInNeeded: true };
  }
  try {
    const wishlist = save
      ? await saveProduct(token, String(productId))
      : await removeProduct(token, String(productId));
    await rememberWishlistCount(wishlist);
    return { savedIds: ids(wishlist), count: wishlist.count, error: null };
  } catch (error) {
    if (!isApiError(error)) throw error;
    return { savedIds: null, count: null, error: wishlistErrorMessage(error.status, error.code) };
  }
}

/** The heart without JavaScript: a plain form that comes back to the same page. */
export async function heartFormAction(form: FormData): Promise<void> {
  const productId = String(form.get("productId") ?? "");
  const save = form.get("save") === "1";
  const back = safeNext(String(form.get("back") ?? "")) ?? "/wishlist";
  const result = await toggleSaveAction(productId, save);
  redirect(result.signInNeeded ? `/sign-in?next=${encodeURIComponent(back)}` : back);
}

export type MoveResult =
  | { kind: "added"; cart: Cart; savedIds: string[]; count: number }
  | { kind: "choose"; href: string }
  | { kind: "error"; error: string };

/**
 * "Move to bag" from the wishlist: with one option in stock, it goes in the
 * bag and leaves the wishlist; with several, the shopper chooses on the
 * product page (it leaves the wishlist once added there).
 */
export async function moveToBagAction(productId: string, slug: string): Promise<MoveResult> {
  const token = await accessToken();
  if (!token) return { kind: "error", error: CART_PROBLEMS.session };
  try {
    const product = await getProduct(String(slug));
    if (product.id !== productId) return { kind: "error", error: CART_PROBLEMS.unavailable };
    const plan = movePlan(product.variants);
    if (plan.kind === "soldout") return { kind: "error", error: CART_PROBLEMS.out_of_stock };
    if (plan.kind === "choose")
      return { kind: "choose", href: `/product/${encodeURIComponent(product.slug)}` };
    const cart = await changeCart({ kind: "add", variantId: plan.variantId, quantity: 1 });
    const wishlist = await removeProduct(token, productId);
    await rememberWishlistCount(wishlist);
    return { kind: "added", cart, savedIds: ids(wishlist), count: wishlist.count };
  } catch (error) {
    const problem = cartProblemCode(error);
    if (problem === null) throw error;
    return { kind: "error", error: CART_PROBLEMS[problem] };
  }
}

/** After adding to the bag on a product page reached from the wishlist: it leaves the wishlist. */
export async function leaveWishlistAction(productId: string): Promise<WishlistResult> {
  return toggleSaveAction(productId, false);
}
