import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { CheckoutPreview, PaymentMethod } from "./rules";

/** The totals and problems for the bag with these choices (changes nothing). */
export function previewCheckout(
  token: string,
  choices: { addressId: string | null; couponCode: string | null; paymentMethod: PaymentMethod },
): Promise<CheckoutPreview> {
  return apiFetch<CheckoutPreview>("/checkout/preview", {
    method: "POST",
    token,
    body: {
      ...(choices.addressId ? { addressId: choices.addressId } : {}),
      ...(choices.couponCode ? { couponCode: choices.couponCode } : {}),
      paymentMethod: choices.paymentMethod,
    },
  });
}

export interface PlacedOrderItem {
  productName: string;
  productSlug: string;
  variantLabel: string;
  imageUrl: string | null;
  unitPrice: string;
  listPrice: string;
  quantity: number;
  lineTotal: string;
}

/** An order, as `POST /orders` and `GET /orders/:orderNumber` return it (the fields the shop uses). */
export interface PlacedOrder {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  items: PlacedOrderItem[];
  subtotal: string;
  discountTotal: string;
  couponCode: string | null;
  shippingTotal: string;
  taxIncluded: string;
  grandTotal: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    postalCode: string;
  };
  notes: string | null;
  placedAt: string;
  expiresAt: string | null;
  confirmedAt: string | null;
  payment: { canPay: boolean; lastFailureMessage: string | null };
}

export function placeOrder(
  token: string,
  idempotencyKey: string,
  order: {
    addressId: string;
    couponCode: string | null;
    paymentMethod: PaymentMethod;
    notes: string | null;
    expectedGrandTotal: string;
  },
): Promise<PlacedOrder> {
  return apiFetch<PlacedOrder>("/orders", {
    method: "POST",
    token,
    headers: { "Idempotency-Key": idempotencyKey },
    body: {
      addressId: order.addressId,
      ...(order.couponCode ? { couponCode: order.couponCode } : {}),
      paymentMethod: order.paymentMethod,
      ...(order.notes ? { notes: order.notes } : {}),
      expectedGrandTotal: order.expectedGrandTotal,
    },
  });
}

export function getOrder(token: string, orderNumber: string): Promise<PlacedOrder> {
  return apiFetch<PlacedOrder>(`/orders/${encodeURIComponent(orderNumber)}`, { token });
}

/** What Razorpay's payment window needs (the key id is public; the secret never leaves the API). */
export interface RazorpayCheckout {
  keyId: string;
  razorpayOrderId: string;
  /** In paise. */
  amount: number;
  currency: string;
  name: string;
  description: string;
  orderNumber: string;
  prefill: { name: string; email: string; contact: string | null };
  notes: Record<string, string>;
  timeoutSeconds: number;
  expiresAt: string;
  testMode: boolean;
}

/** Opens (or reopens) payment for an unpaid online order. */
export function startPayment(token: string, orderNumber: string): Promise<RazorpayCheckout> {
  return apiFetch<RazorpayCheckout>(
    `/orders/${encodeURIComponent(orderNumber)}/payments/razorpay`,
    { method: "POST", token, body: {} },
  );
}

/** Razorpay's success result, checked by the API (signature, then Razorpay itself). */
export function verifyPayment(
  token: string,
  orderNumber: string,
  result: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
): Promise<PlacedOrder> {
  return apiFetch<PlacedOrder>(
    `/orders/${encodeURIComponent(orderNumber)}/payments/razorpay/verify`,
    { method: "POST", token, body: result },
  );
}
