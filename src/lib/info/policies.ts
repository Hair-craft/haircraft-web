import { formatPrice } from "@/lib/format";

/** The shop's public rules (`GET /shop/policies`, backend B15). */
export interface ShopPolicies {
  currency: string;
  shippingFee: string;
  freeShippingThreshold: string;
  gstRatePercent: number;
  paymentWindowMinutes: number;
  cashOnDelivery: { enabled: boolean; maxOrderAmount: string | null };
  /** Razorpay Magic Checkout is on: Buy now and the bag open Razorpay's window (owner, 2026-11-20). */
  magicCheckout?: boolean;
}

const isZero = (amount: string) => /^0+(\.0+)?$/.test(amount.trim());

/** Is every order delivered free (no charge, or a free-delivery minimum of 0)? */
export function alwaysFree(policies: ShopPolicies): boolean {
  return isZero(policies.shippingFee) || isZero(policies.freeShippingThreshold);
}

/**
 * The delivery charge in one sentence. Without the policies (API down) the
 * numbers are left out rather than guessed.
 */
export function deliveryLine(policies: ShopPolicies | null): string {
  if (!policies) return "The delivery charge for your order is shown in your bag and at checkout.";
  if (alwaysFree(policies)) return "Delivery is free on every order.";
  return `Delivery is free on orders of ${formatPrice(policies.freeShippingThreshold)} or more; below that it costs ${formatPrice(policies.shippingFee)}.`;
}

/** Short form for summary boxes. */
export function deliveryShort(policies: ShopPolicies | null): string {
  if (!policies) return "Delivery charge shown at checkout";
  if (alwaysFree(policies)) return "Free delivery on every order";
  return `Free delivery over ${formatPrice(policies.freeShippingThreshold)}`;
}

/** Cash on delivery, when the shop offers it. */
export function cashOnDeliveryLine(policies: ShopPolicies | null): string | null {
  if (!policies?.cashOnDelivery.enabled) return null;
  const max = policies.cashOnDelivery.maxOrderAmount;
  return max
    ? `Cash on delivery is available for orders up to ${formatPrice(max)}.`
    : "Cash on delivery is available.";
}

/**
 * What happens to an unpaid online order (owner, 2026-11-20: no time limit;
 * closing the payment window cancels it).
 */
export function paymentWindowLine(): string {
  return "If you close the payment window without paying, the order is cancelled straight away, nothing is charged and the items go back in your bag, so you can try again.";
}

/** "Prices include GST." with the rate when known. */
export function gstLine(policies: ShopPolicies | null): string {
  return policies
    ? `All prices are in Indian rupees and include GST (${policies.gstRatePercent}%).`
    : "All prices are in Indian rupees and include GST.";
}
