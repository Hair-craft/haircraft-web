import { returnRules as r } from "./returns-rules";
import type { InfoContent } from "./types";

/**
 * The exchange policy (owner's decision, 2026-10-28): exchange only, within
 * a few days of delivery, for defective (or wrong) items that are unused.
 * No returns or refunds after delivery; cancelling before shipping is still
 * refunded, which is how the shop already works.
 */
export const returnsContent: InfoContent = {
  intro:
    "Hair is a personal-care product, so we don't take back hair once it has been delivered. If an item arrives defective, we exchange it.",
  summary: [
    "Cancel any time before it ships, with a full refund",
    `Defective and unused? Exchange within ${r.exchangeDays} days of delivery`,
    "No returns or refunds after delivery",
  ],
  sections: [
    {
      id: "exchange",
      heading: "Exchange for defective items",
      blocks: [
        `If an item arrives **defective** (or isn't what you ordered), you can exchange it within **${r.exchangeDays} days of delivery**, as long as it is **unused**:`,
        {
          list: [
            "it hasn't been worn, washed, cut, coloured, heat-styled or treated",
            "it's in its original packaging, with the seal and any tags intact",
          ],
        },
        {
          steps: [
            `[Contact us](/contact) within ${r.exchangeDays} days of delivery, with your order number.`,
            "Send photos of the defect and the packaging, or an unboxing video if you made one.",
            "Once we've checked it, we arrange the collection at no cost to you and send a replacement: the same item, or another of the same value if it's sold out.",
          ],
        },
      ],
    },
    {
      id: "no-returns",
      heading: "No returns or refunds after delivery",
      blocks: [
        "For hygiene reasons, we don't accept returns or give refunds once an order has been delivered, including for a change of mind.",
        "Items that have been worn, washed, cut, coloured, heat-styled or treated, wigs tried on without their protective cap, and items without their original packaging and seal can't be exchanged.",
      ],
    },
    {
      id: "cancel",
      heading: "Cancelling an order",
      blocks: [
        "You can cancel an order yourself until it ships: open it in [My orders](/account/orders) and choose **Cancel order**.",
        `If you paid online, the full amount goes back to the way you paid (UPI, card, net banking or wallet) within **${r.refundWorkingDays} working days**. Your bank may take a few more days to show it. If you chose cash on delivery, there's nothing to refund.`,
        "Once an order has shipped it can't be cancelled.",
      ],
    },
    {
      id: "help",
      heading: "Need help?",
      blocks: [
        "[Contact us](/contact) with your order number and we'll help. If you're not happy with how we've handled a problem, you can write to our grievance officer (details on the [Contact](/contact#grievance) page).",
      ],
    },
  ],
};
