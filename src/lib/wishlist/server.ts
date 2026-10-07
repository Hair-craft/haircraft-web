import "server-only";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { ACCESS_COOKIE, sessionCookieOptions } from "@/lib/session/cookies";
import { pendingSaveId, type Wishlist } from "./rules";

/** The wishlist's count for the header (display only; the API is the authority). */
export const WISHLIST_COUNT_COOKIE = "hc_wish";
/** A product a guest asked to save: saved once they sign in or register. */
export const PENDING_SAVE_COOKIE = "hc_save";

const production = () => process.env.NODE_ENV === "production";

export function getWishlist(token: string): Promise<Wishlist> {
  return apiFetch<Wishlist>("/wishlist", { token });
}

export function saveProduct(token: string, productId: string): Promise<Wishlist> {
  return apiFetch<Wishlist>("/wishlist/items", { method: "POST", token, body: { productId } });
}

export function removeProduct(token: string, productId: string): Promise<Wishlist> {
  return apiFetch<Wishlist>(`/wishlist/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    token,
  });
}

export async function accessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value || null;
}

/** The header's count, from the display cookie. */
export async function wishlistCount(): Promise<number> {
  const value = Number((await cookies()).get(WISHLIST_COUNT_COOKIE)?.value);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 999) : 0;
}

export async function rememberWishlistCount(wishlist: Wishlist) {
  (await cookies()).set(
    WISHLIST_COUNT_COOKIE,
    String(wishlist.count),
    sessionCookieOptions(30 * 24 * 3600, production()),
  );
}

/** A guest pressed a heart: keep the product for 30 minutes, to save it after sign-in. */
export async function rememberPendingSave(productId: string) {
  const id = pendingSaveId(productId);
  if (!id) return;
  (await cookies()).set(PENDING_SAVE_COOKIE, id, sessionCookieOptions(30 * 60, production()));
}

/**
 * After sign-in or registration: save the product the guest asked for, and
 * set the header count. Problems here never block signing in.
 */
export async function wishlistAfterSignIn(token: string) {
  const store = await cookies();
  const pending = pendingSaveId(store.get(PENDING_SAVE_COOKIE)?.value);
  store.delete(PENDING_SAVE_COOKIE);
  try {
    await rememberWishlistCount(
      pending ? await saveProduct(token, pending) : await getWishlist(token),
    );
  } catch (error) {
    if (!isApiError(error)) throw error;
  }
}

/** On sign-out: no wishlist count for a guest. */
export async function forgetWishlist() {
  const store = await cookies();
  store.delete(WISHLIST_COUNT_COOKIE);
  store.delete(PENDING_SAVE_COOKIE);
}
