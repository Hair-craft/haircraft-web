import {
  cashOnDeliveryLine,
  deliveryLine,
  deliveryShort,
  type ShopPolicies,
} from "@/lib/info/policies";
import { returnRules as r } from "./returns-rules";
import type { InfoContent } from "./types";

/**
 * DRAFT — OWNER TO CONFIRM: the courier, dispatch and delivery times. The
 * delivery charge and cash on delivery come from the API's settings (B15), so
 * they always match checkout.
 */
export function shippingContent(policies: ShopPolicies | null): InfoContent {
  const cod = cashOnDeliveryLine(policies);
  return {
    intro:
      "We deliver across India with tracking, and every order is checked by hand before it leaves us.",
    summary: [
      deliveryShort(policies),
      `Packed within ${r.dispatchWorkingDays} working days`,
      "Tracked to your door",
    ],
    sections: [
      {
        id: "charges",
        heading: "Delivery charges",
        blocks: [
          deliveryLine(policies),
          "The exact charge for your order is shown in your bag and at checkout before you pay, and nothing is added afterwards.",
        ],
      },
      {
        id: "times",
        heading: "When your order arrives",
        blocks: [
          `We pack orders within **${r.dispatchWorkingDays} working days** of payment (Monday to Saturday, not public holidays) and hand them to our courier partner.`,
          `Most orders then arrive within **${r.deliveryWorkingDays} working days**, depending on where you are. Remote areas can take a little longer.`,
        ],
      },
      {
        id: "where",
        heading: "Where we deliver",
        blocks: [
          "We deliver to addresses across India. If our courier can't reach your PIN code, we'll contact you before your order ships and refund you in full if you'd like.",
          "We don't ship outside India at the moment.",
        ],
      },
      {
        id: "tracking",
        heading: "Tracking your order",
        blocks: [
          "When your order is shipped, its tracking details appear in [My orders](/account/orders). You can follow it there from our door to yours.",
        ],
      },
      {
        id: "payment",
        heading: "Paying for your order",
        blocks: [
          "Pay securely online by UPI, card, net banking or wallet through Razorpay. We never see or keep your card details.",
          ...(cod ? [cod] : []),
        ],
      },
      {
        id: "problems",
        heading: "If something goes wrong",
        blocks: [
          "If your parcel is late, looks damaged or opened when it arrives, or tracking hasn't moved for a few days, [contact us](/contact) and we'll sort it out with the courier.",
          `If an item arrives damaged or isn't what you ordered, tell us within ${r.reportProblemHours} hours of delivery; see [Returns & refunds](/returns#damaged).`,
        ],
      },
    ],
  };
}
