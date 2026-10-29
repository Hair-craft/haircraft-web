import { returnRules as r } from "@/content/returns-rules";

/**
 * The "Delivery & exchange" note on every product page: short, and linked to
 * the full policies. The numbers come from the same rules as the Exchange
 * policy page (`src/content/returns-rules.ts`).
 */
export const deliveryAndReturns: string[] = [
  `Packed within ${r.dispatchWorkingDays} working days and delivered across India with tracking. The delivery charge for your order is shown in your bag. [Shipping details](/shipping)`,
  `Defective items can be exchanged within ${r.exchangeDays} days of delivery if unused. No returns or refunds after delivery. [Exchange policy](/returns)`,
];
