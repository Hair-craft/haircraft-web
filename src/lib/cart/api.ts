import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { Cart, GuestLine } from "./rules";

/** The signed-in customer's cart. */
export function getCart(token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart", { token });
}

export function addCartItem(token: string, variantId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>("/cart/items", { method: "POST", token, body: { variantId, quantity } });
}

export function setCartItemQuantity(
  token: string,
  lineId: string,
  quantity: number,
): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${encodeURIComponent(lineId)}`, {
    method: "PATCH",
    token,
    body: { quantity },
  });
}

export function removeCartItem(token: string, lineId: string): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${encodeURIComponent(lineId)}`, { method: "DELETE", token });
}

/** A guest's lines priced like a signed-in cart (B12); nothing is saved. */
export function previewCart(lines: GuestLine[]): Promise<Cart> {
  return apiFetch<Cart>("/cart/preview", { method: "POST", body: { items: lines } });
}

export interface MergeResult {
  cart: Cart;
  skipped: { variantId: string; reason: "unavailable" | "cart_full" }[];
}

/** Adds a guest's lines to the customer's cart after sign-in. */
export function mergeCart(token: string, lines: GuestLine[]): Promise<MergeResult> {
  return apiFetch<MergeResult>("/cart/merge", { method: "POST", token, body: { items: lines } });
}
