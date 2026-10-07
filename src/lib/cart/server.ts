import "server-only";
import { cookies } from "next/headers";
import { isApiError } from "@/lib/api/errors";
import { ACCESS_COOKIE, sessionCookieOptions } from "@/lib/session/cookies";
import {
  addCartItem,
  getCart,
  mergeCart,
  previewCart,
  removeCartItem,
  setCartItemQuantity,
} from "./api";
import {
  changeGuestCart,
  decodeGuestCart,
  encodeGuestCart,
  EMPTY_CART,
  type Cart,
  type GuestChange,
  type GuestLine,
} from "./rules";

/** A guest's bag: variant ids and quantities only (D6), httpOnly. */
export const GUEST_CART_COOKIE = "hc_cart";
/** The bag's item count for the header (display only; the API is the authority). */
export const CART_COUNT_COOKIE = "hc_count";
const KEEP_FOR_SECONDS = 30 * 24 * 3600;

const production = () => process.env.NODE_ENV === "production";

/** The header's count, from the display cookie (0 when there is none). */
export async function cartCount(): Promise<number> {
  const value = Number((await cookies()).get(CART_COUNT_COOKIE)?.value);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 999) : 0;
}

/** Records the count (only possible in server actions and route handlers). */
async function rememberCount(cart: Cart) {
  (await cookies()).set(
    CART_COUNT_COOKIE,
    String(cart.itemCount),
    sessionCookieOptions(KEEP_FOR_SECONDS, production()),
  );
}

async function writeGuestLines(lines: GuestLine[]) {
  const store = await cookies();
  if (lines.length === 0) store.delete(GUEST_CART_COOKIE);
  else
    store.set(
      GUEST_CART_COOKIE,
      encodeGuestCart(lines),
      sessionCookieOptions(KEEP_FOR_SECONDS, production()),
    );
}

async function guestLines(): Promise<GuestLine[]> {
  return decodeGuestCart((await cookies()).get(GUEST_CART_COOKIE)?.value);
}

async function accessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value || null;
}

/** The current bag, read-only (pages): the account's cart, or the guest's priced by the API. */
export async function readCart(): Promise<Cart> {
  const token = await accessToken();
  if (token) return getCart(token);
  const lines = await guestLines();
  return lines.length === 0 ? EMPTY_CART : previewCart(lines);
}

export type CartChange =
  | { kind: "add"; variantId: string; quantity: number }
  | { kind: "set"; lineId: string; variantId: string; quantity: number }
  | { kind: "remove"; lineId: string; variantId: string };

/** Why a change didn't happen. Codes (not text) travel in addresses, so a link can't make the page say anything else. */
export type CartProblemCode =
  | "limited"
  | "out_of_stock"
  | "unavailable"
  | "line_full"
  | "cart_full"
  | "session"
  | "unreachable"
  | "other";

export const CART_PROBLEMS: Record<CartProblemCode, string> = {
  limited: "Only a limited quantity of this item is available.",
  out_of_stock: "This item is out of stock.",
  unavailable: "This item is no longer available.",
  line_full: "You can have at most 10 of one item in your bag.",
  cart_full: "Your bag is full (50 different items). Remove something to add more.",
  session: "Your session has ended. Please sign in again.",
  unreachable: "We can't reach the shop at the moment. Please try again in a minute.",
  other: "That didn't work. Please try again.",
};

/** A change the shop refused. */
export class CartProblem extends Error {
  constructor(readonly code: CartProblemCode) {
    super(CART_PROBLEMS[code]);
  }
}

/**
 * Applies a change and returns the bag afterwards. Signed in, the API does
 * it. For a guest, the cookie changes only if the API's preview says the
 * result is fine (the same rules as a signed-in cart: no adding more than is
 * in stock, or something no longer sold); lowering is always allowed.
 */
export async function changeCart(change: CartChange): Promise<Cart> {
  const token = await accessToken();
  let cart: Cart;
  if (token) {
    cart =
      change.kind === "add"
        ? await addCartItem(token, change.variantId, change.quantity)
        : change.kind === "set"
          ? await setCartItemQuantity(token, change.lineId, change.quantity)
          : await removeCartItem(token, change.lineId);
  } else {
    const before = await guestLines();
    const guestChange: GuestChange =
      change.kind === "remove"
        ? { kind: "remove", variantId: change.variantId }
        : { kind: change.kind, variantId: change.variantId, quantity: change.quantity };
    const result = changeGuestCart(before, guestChange);
    if ("problem" in result) throw new CartProblem(result.problem);
    cart = await previewCart(result.lines);
    const changed = cart.lines.find((l) => l.variantId === change.variantId.toLowerCase());
    const old = before.find((l) => l.variantId === change.variantId.toLowerCase());
    const raising =
      change.kind === "add" || (change.kind === "set" && change.quantity > (old?.quantity ?? 0));
    if (raising && changed && changed.availability !== "available") {
      // Not saved: the bag stays as it was, and the shopper is told why.
      throw new CartProblem(
        changed.availability === "unavailable"
          ? "unavailable"
          : changed.message === CART_PROBLEMS.out_of_stock
            ? "out_of_stock"
            : "limited",
      );
    }
    if (change.kind === "add" && !changed) throw new CartProblem("unavailable");
    // Items the API no longer knows are dropped from the cookie.
    await writeGuestLines(
      result.lines.filter((l) => cart.lines.some((c) => c.variantId === l.variantId)),
    );
  }
  await rememberCount(cart);
  return cart;
}

/** The problem behind a refused change (`null` for errors that aren't a shopper's problem). */
export function cartProblemCode(error: unknown): CartProblemCode | null {
  if (error instanceof CartProblem) return error.code;
  if (!isApiError(error)) return null;
  switch (error.code) {
    case "INSUFFICIENT_STOCK":
      return "limited";
    case "PRODUCT_UNAVAILABLE":
      return "unavailable";
    case "CART_LIMIT_REACHED":
      return "cart_full";
    case "VALIDATION_FAILED":
      return "line_full";
  }
  if (error.status === 401) return "session";
  if (error.status === 0 || error.status >= 500) return "unreachable";
  return "other";
}

/**
 * After sign-in or registration: the guest's bag joins the account's. The
 * cookie is cleared and the header count set from the account's bag.
 * Returns how many lines the API couldn't add (no longer sold, bag full).
 */
export async function mergeGuestCartInto(token: string): Promise<number> {
  const lines = await guestLines();
  try {
    if (lines.length === 0) {
      await rememberCount(await getCart(token));
      return 0;
    }
    const { cart, skipped } = await mergeCart(token, lines);
    await writeGuestLines([]);
    await rememberCount(cart);
    return skipped.length;
  } catch (error) {
    // Signing in still succeeds; the guest's bag stays in the cookie for a later try.
    if (!isApiError(error)) throw error;
    return 0;
  }
}

/** After an order: the account's bag was emptied by the API (server actions only). */
export async function rememberEmptyBag() {
  (await cookies()).set(
    CART_COUNT_COOKIE,
    "0",
    sessionCookieOptions(KEEP_FOR_SECONDS, production()),
  );
}

/** On sign-out: the shopper is a guest with an empty bag (the account keeps its own). */
export async function forgetCart() {
  const store = await cookies();
  store.delete(GUEST_CART_COOKIE);
  store.delete(CART_COUNT_COOKIE);
}
