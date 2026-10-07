/**
 * Checkout rules that need no server or browser, so they are unit-tested:
 * the page's address-bar state, idempotency keys and the shop's messages.
 */
import type { Address } from "@/lib/account/rules";
import type { CartLine } from "@/lib/cart/rules";

export type PaymentMethod = "ONLINE" | "COD";

/** What the checkout page's address bar holds: every choice, so a reload or no-JavaScript form keeps it. */
export interface CheckoutState {
  address: string | null;
  coupon: string | null;
  pay: PaymentMethod;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A coupon code as typed: trimmed, upper case, letters, digits, "-" and "_" (at most 30). */
export function couponCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return /^[A-Z0-9_-]{1,30}$/.test(code) ? code : null;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the checkout page's search params (anything unexpected is ignored). */
export function readCheckoutState(
  params: Record<string, string | string[] | undefined>,
): CheckoutState {
  const address = one(params.address);
  return {
    address: address && UUID.test(address) ? address.toLowerCase() : null,
    coupon: couponCode(one(params.coupon)),
    pay: one(params.pay) === "cod" ? "COD" : "ONLINE",
  };
}

/** The checkout page's address for a state (only what differs from the defaults). */
export function checkoutHref(state: CheckoutState, notice?: CheckoutNotice): string {
  const query = new URLSearchParams();
  if (state.address) query.set("address", state.address);
  if (state.coupon) query.set("coupon", state.coupon);
  if (state.pay === "COD") query.set("pay", "cod");
  if (notice) query.set("notice", notice);
  const text = query.toString();
  return text ? `/checkout?${text}` : "/checkout";
}

/** The address to deliver to: the one asked for if it's still saved, else the default, else the first. */
export function chosenAddress(addresses: Address[], wanted: string | null): Address | null {
  return (
    addresses.find((a) => a.id === wanted) ??
    addresses.find((a) => a.isDefault) ??
    addresses[0] ??
    null
  );
}

/** One key per checkout attempt; the API stores it only once an order is placed. */
export function idempotencyKey(random: string): string {
  return `checkout-${random}`.slice(0, 100);
}

export function isIdempotencyKey(value: string): boolean {
  return /^[A-Za-z0-9_.:-]{8,100}$/.test(value);
}

/**
 * Why checkout came back to itself instead of placing the order. The address
 * bar carries only these codes, never text (so no one can make the page say
 * anything with a crafted link).
 */
export const CHECKOUT_NOTICES = {
  "price-changed":
    "Prices changed while you were checking out. Please look over the new total and place your order again.",
  "bag-changed":
    "Something in your bag changed (an item ran short or is no longer available). Please check it.",
  coupon: "That coupon can't be used for this order, so it has been taken off.",
  address: "Please choose where to deliver your order.",
  cod: "Cash on delivery isn't available for this order. Please pay online.",
  "already-placed": "This order has already been placed.",
  unavailable: "We can't reach the shop at the moment. Please try again in a minute.",
  failed: "That didn't work. Please try again.",
} as const;

export type CheckoutNotice = keyof typeof CHECKOUT_NOTICES;

export function checkoutNotice(raw: string | string[] | undefined): string | null {
  const code = one(raw);
  return code && Object.hasOwn(CHECKOUT_NOTICES, code)
    ? CHECKOUT_NOTICES[code as CheckoutNotice]
    : null;
}

/** The API's refusal when placing an order, as the notice to show (and what to undo). */
export function noticeForOrderError(
  status: number,
  code: string,
): { notice: CheckoutNotice; dropCoupon?: true; payOnline?: true } {
  switch (code) {
    case "PRICE_CHANGED":
      return { notice: "price-changed" };
    case "CART_NOT_READY":
    case "CART_EMPTY":
      return { notice: "bag-changed" };
    case "COUPON_INVALID":
      return { notice: "coupon", dropCoupon: true };
    case "ADDRESS_REQUIRED":
    case "ADDRESS_NOT_FOUND":
      return { notice: "address" };
    case "COD_NOT_AVAILABLE":
      return { notice: "cod", payOnline: true };
    case "IDEMPOTENCY_KEY_REUSED":
      return { notice: "already-placed" };
  }
  if (status === 0 || status >= 500) return { notice: "unavailable" };
  return { notice: "failed" };
}

/** The checkout preview's totals (amounts are strings, as the API sends them). */
export interface CheckoutTotals {
  subtotal: string;
  discount: string;
  shipping: string;
  grandTotal: string;
  gstIncluded: string;
  currency: string;
}

export interface CheckoutCoupon {
  code: string;
  applied: boolean;
  reason: string | null;
  message: string | null;
  discount: string;
}

export interface CheckoutProblem {
  code: string;
  message: string;
  lineId: string | null;
}

/** `POST /checkout/preview`. */
export interface CheckoutPreview {
  lines: CartLine[];
  totals: CheckoutTotals;
  amountToFreeShipping: string | null;
  coupon: CheckoutCoupon | null;
  address: Address | null;
  paymentMethods: { online: boolean; cod: boolean; razorpay: boolean };
  problems: CheckoutProblem[];
  canPlaceOrder: boolean;
}

/** Problems the shopper fixes in the bag (the page handles the address and payment ones itself). */
export function bagProblems(preview: CheckoutPreview): CheckoutProblem[] {
  return preview.problems.filter((p) => p.code === "LINE_NOT_AVAILABLE");
}

/** "Free" for no shipping, else the amount. */
export const isFree = (amount: string) => Number(amount) === 0;

export type OrderStatus =
  "PENDING_PAYMENT" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/** What the confirmation page says happens next. */
export function nextSteps(order: { status: string; paymentMethod: string }): {
  title: string;
  text: string;
} {
  if (order.status === "CANCELLED")
    return {
      title: "Cancelled",
      text: "This order was cancelled. Anything held for it has been released.",
    };
  if (order.paymentMethod === "COD")
    return {
      title: "Confirmed: pay when it arrives",
      text: "We'll let you know when it's on its way. Please keep the amount ready in cash or UPI for the courier.",
    };
  if (order.status === "PENDING_PAYMENT")
    return {
      title: "Awaiting payment",
      text: "You'll be able to pay online here soon. We hold your items for a short while; unpaid orders are cancelled automatically.",
    };
  return { title: "Confirmed", text: "We'll let you know when it's on its way." };
}
