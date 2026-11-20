"use server";

import { cookies } from "next/headers";
import { isApiError } from "@/lib/api/errors";
import { forgetCart, rememberEmptyBag } from "@/lib/cart/server";
import { ACCESS_COOKIE } from "@/lib/session/cookies";
import {
  closeMagicCheckout,
  completeMagicCheckout,
  startMagicCheckout,
  type MagicCheckoutResult,
  type MagicCheckoutStart,
} from "./magic-api";

export type MagicOpenResult =
  { ok: true; start: MagicCheckoutStart } | { ok: false; message: string };
export type MagicDoneResult =
  { ok: true; result: MagicCheckoutResult } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RAZORPAY_ORDER = /^order_[A-Za-z0-9]{6,40}$/;

/** In the shop's words: never the API's text for problems we can name. */
function problem(error: unknown): string {
  if (!isApiError(error)) throw error;
  if (error.code === "CART_NOT_READY")
    return "Some of these items have just sold out or are limited. Please check your bag.";
  if (error.code === "PAYMENTS_UNAVAILABLE")
    return "We couldn't open the payment window. Nothing has been charged. Please try again in a minute.";
  return "That didn't work. Please try again.";
}

/**
 * Opens Razorpay Magic Checkout for these lines (Buy now: one; the bag: all).
 * Signed in, the order is the customer's; otherwise it is a guest order.
 */
export async function openMagicCheckoutAction(
  raw: { variantId: string; quantity: number }[],
  fromBag: boolean,
): Promise<MagicOpenResult> {
  const items = (Array.isArray(raw) ? raw : [])
    .filter((item) => UUID.test(String(item?.variantId)))
    .slice(0, 50)
    .map((item) => ({
      variantId: String(item.variantId).toLowerCase(),
      quantity: Math.min(10, Math.max(1, Math.floor(Number(item.quantity) || 1))),
    }));
  if (items.length === 0) return { ok: false, message: "There is nothing to buy." };
  const token = (await cookies()).get(ACCESS_COOKIE)?.value || null;
  try {
    return { ok: true, start: await startMagicCheckout(token, items, Boolean(fromBag)) };
  } catch (error) {
    return { ok: false, message: problem(error) };
  }
}

/** The window finished: the order is filled from Razorpay and confirmed; a bag checkout empties the bag. */
export async function completeMagicCheckoutAction(
  razorpayOrderId: string,
  raw: unknown,
  fromBag: boolean,
): Promise<MagicDoneResult> {
  if (!RAZORPAY_ORDER.test(String(razorpayOrderId)))
    return { ok: false, message: "That didn't work. Please try again." };
  const response = (raw ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value.slice(0, 200) : undefined);
  try {
    const result = await completeMagicCheckout(String(razorpayOrderId), {
      razorpayPaymentId: text(response.razorpay_payment_id),
      razorpaySignature: text(response.razorpay_signature),
    });
    if (result.status === "completed" && fromBag) {
      const signedIn = Boolean((await cookies()).get(ACCESS_COOKIE)?.value);
      // Signed in, the API emptied the account's bag; a guest's is in a cookie.
      if (signedIn) await rememberEmptyBag();
      else await forgetCart();
    }
    return { ok: true, result };
  } catch (error) {
    return { ok: false, message: problem(error) };
  }
}

/** Closed without paying (owner, 2026-11-20): the unpaid order is cancelled, nothing charged. */
export async function closeMagicCheckoutAction(razorpayOrderId: string): Promise<MagicDoneResult> {
  if (!RAZORPAY_ORDER.test(String(razorpayOrderId)))
    return { ok: false, message: "That didn't work. Please try again." };
  try {
    return { ok: true, result: await closeMagicCheckout(String(razorpayOrderId)) };
  } catch (error) {
    return { ok: false, message: problem(error) };
  }
}
