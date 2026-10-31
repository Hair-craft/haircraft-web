import { returnRules as r } from "@/content/returns-rules";
import { formatPrice } from "@/lib/format";

/**
 * The "Delivery & exchange" note on every product page: short, and linked to
 * the full policies. The numbers come from the same rules as the Exchange
 * policy page (`src/content/returns-rules.ts`).
 */
export const deliveryAndReturns: string[] = [
  `Packed within ${r.dispatchWorkingDays} working days and delivered across India with tracking. The delivery charge for your order is shown in your bag. [Shipping details](/shipping)`,
  `Defective items can be exchanged within ${r.exchangeDays} days of delivery if unused. No returns or refunds after delivery. [Exchange policy](/returns)`,
];

/** The three promises under the product photos (the shop's real ones). */
export const productPromises = [
  { title: "100% human hair", text: "Style, curl and colour" },
  { title: "Secure payments", text: "UPI, cards & net banking" },
  { title: "Defective? Exchanged", text: `Within ${r.exchangeDays} days, if unused` },
];

/** The short delivery lines under Add to bag. */
export function deliveryPoints(freeShippingThreshold: string | null): string[] {
  const shipping =
    freeShippingThreshold === null
      ? "Tracked delivery across India"
      : Number(freeShippingThreshold) === 0
        ? "Free delivery on every order"
        : `Free delivery on orders above ${formatPrice(freeShippingThreshold)}`;
  return [
    shipping,
    `Packed and sent in ${r.dispatchWorkingDays} working days`,
    `Defective items exchanged within ${r.exchangeDays} days of delivery`,
  ];
}
