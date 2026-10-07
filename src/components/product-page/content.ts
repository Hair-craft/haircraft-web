import { returnRules as r } from "@/content/returns-rules";

/**
 * The "Delivery & returns" note on every product page: short, and linked to
 * the full policies (S14). The numbers come from the same draft rules as the
 * Returns page (`src/content/returns-rules.ts`).
 */
export const deliveryAndReturns: string[] = [
  `Packed within ${r.dispatchWorkingDays} working days and delivered across India with tracking. The delivery charge for your order is shown in your bag. [Shipping details](/shipping)`,
  `Unused hair in its sealed packaging can be returned within ${r.changeOfMindDays} days of delivery, and damaged or wrong items are always put right. [Returns & refunds](/returns)`,
];
