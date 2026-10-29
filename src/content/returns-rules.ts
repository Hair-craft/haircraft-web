/**
 * The exchange policy (owner's decision, 2026-10-28): no returns or refunds
 * after delivery; an exchange within a few days if an item is defective and
 * unused. Cancelling before shipping is still refunded. Kept here so the
 * Exchange policy page, the FAQ and the product page say the same thing;
 * change a number here and all of them follow.
 */
export const returnRules = {
  /** A defective (or wrong), unused item can be exchanged within this many days of delivery. */
  exchangeDays: 4,
  /** Cancelled orders are refunded to the way the customer paid within this many working days. */
  refundWorkingDays: "5–7",
  /** How soon orders are packed and handed to the courier. */
  dispatchWorkingDays: "1–2",
  /** Usual delivery time after dispatch. */
  deliveryWorkingDays: "3–7",
} as const;
