/**
 * DRAFT — OWNER TO CONFIRM: the returns rules approved as the starting draft
 * (S14 plan, open question 3). Kept here so the Returns page, the FAQ and the
 * product page say the same thing; change a number here and all of them follow.
 */
export const returnRules = {
  /** Damaged, faulty or wrong items must be reported within this many hours of delivery. */
  reportProblemHours: 48,
  /** Change-of-mind returns or exchanges are accepted within this many days of delivery. */
  changeOfMindDays: 7,
  /** Refunds reach the customer within this many working days of approval. */
  refundWorkingDays: "5–7",
  /** How soon orders are packed and handed to the courier. */
  dispatchWorkingDays: "1–2",
  /** Usual delivery time after dispatch. */
  deliveryWorkingDays: "3–7",
} as const;
