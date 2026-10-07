"use server";

import { redirect } from "next/navigation";
import { clampQuantity, EMPTY_CART, type Cart } from "./rules";
import {
  CART_PROBLEMS,
  cartProblemCode,
  changeCart,
  readCart,
  type CartChange,
  type CartProblemCode,
} from "./server";

export interface CartResult {
  cart: Cart | null;
  /** Why the change didn't happen, in the shop's words. */
  error: string | null;
  problem: CartProblemCode | null;
}

async function attempt(work: () => Promise<Cart>): Promise<CartResult> {
  try {
    return { cart: await work(), error: null, problem: null };
  } catch (error) {
    const problem = cartProblemCode(error);
    if (problem === null) throw error;
    // Show the bag as it is now, alongside the problem (if it can be read).
    let cart: Cart | null = null;
    try {
      cart = await readCart();
    } catch {
      cart = null;
    }
    return { cart, error: CART_PROBLEMS[problem], problem };
  }
}

/** The bag as it is now (the drawer, when it opens). */
export async function loadCartAction(): Promise<CartResult> {
  return attempt(readCart);
}

/** Add to bag, change a quantity or remove a line (the drawer and Add to bag, with JavaScript). */
export async function changeCartAction(change: CartChange): Promise<CartResult> {
  const safe: CartChange =
    change.kind === "remove"
      ? { kind: "remove", lineId: String(change.lineId), variantId: String(change.variantId) }
      : change.kind === "add"
        ? {
            kind: "add",
            variantId: String(change.variantId),
            quantity: clampQuantity(change.quantity),
          }
        : {
            kind: "set",
            lineId: String(change.lineId),
            variantId: String(change.variantId),
            quantity: clampQuantity(change.quantity),
          };
  return attempt(() => changeCart(safe));
}

/**
 * The same changes as plain form posts (the cart page and Add to bag without
 * JavaScript): afterwards the cart page is shown, with any problem in the
 * address as a short code (`?problem=limited`).
 */
export async function cartFormAction(form: FormData): Promise<void> {
  const op = String(form.get("op") ?? "");
  const variantId = String(form.get("variantId") ?? "");
  const lineId = String(form.get("lineId") ?? variantId);
  const quantity = clampQuantity(Number(form.get("quantity") ?? 1));
  const change: CartChange | null =
    op === "add"
      ? { kind: "add", variantId, quantity }
      : op === "set"
        ? { kind: "set", lineId, variantId, quantity }
        : op === "remove"
          ? { kind: "remove", lineId, variantId }
          : null;
  const result = change
    ? await attempt(() => changeCart(change))
    : { cart: EMPTY_CART, error: null, problem: null };
  // Only a code goes in the address; the cart page has the words.
  redirect(result.problem ? `/cart?problem=${result.problem}` : "/cart");
}
