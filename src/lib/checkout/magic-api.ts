import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { PlacedOrder } from "./api";

/**
 * Razorpay Magic Checkout (owner, 2026-11-20): the API opens an order for the
 * lines and the Razorpay order Razorpay's window pays; the window takes the
 * phone login, address, coupon and payment (online or cash on delivery).
 */
export interface MagicCheckoutStart {
  keyId: string;
  razorpayOrderId: string;
  orderNumber: string;
  name: string;
  prefill: { name: string; email: string | null; contact: string | null } | null;
  testMode: boolean;
}

export interface MagicCheckoutResult {
  status: "completed" | "pending" | "cancelled";
  orderNumber: string;
  /** The private link to a guest's confirmation page. */
  receiptToken: string | null;
}

export function startMagicCheckout(
  token: string | null,
  items: { variantId: string; quantity: number }[],
  fromBag: boolean,
): Promise<MagicCheckoutStart> {
  return apiFetch<MagicCheckoutStart>(token ? "/checkout/magic" : "/checkout/magic/guest", {
    method: "POST",
    ...(token ? { token } : {}),
    body: token ? { items, fromBag } : { items },
  });
}

export function completeMagicCheckout(
  razorpayOrderId: string,
  result: { razorpayPaymentId?: string; razorpaySignature?: string },
): Promise<MagicCheckoutResult> {
  return apiFetch<MagicCheckoutResult>(
    `/checkout/magic/${encodeURIComponent(razorpayOrderId)}/complete`,
    { method: "POST", body: result },
  );
}

export function closeMagicCheckout(razorpayOrderId: string): Promise<MagicCheckoutResult> {
  return apiFetch<MagicCheckoutResult>(
    `/checkout/magic/${encodeURIComponent(razorpayOrderId)}/close`,
    { method: "POST", body: {} },
  );
}

/** A guest's order by its private link (the confirmation page). */
export function getMagicReceipt(receiptToken: string): Promise<PlacedOrder> {
  return apiFetch<PlacedOrder>(`/checkout/magic/receipts/${encodeURIComponent(receiptToken)}`);
}
