import { returnRules as r } from "./returns-rules";
import type { InfoContent } from "./types";

/**
 * DRAFT — OWNER TO CONFIRM: the returns, refunds and cancellations policy
 * approved as the starting draft (S14, open question 3). Cancelling before
 * shipping and refunds to the original payment method are how the shop
 * already works; the rest is the owner's to confirm or change.
 */
export const returnsContent: InfoContent = {
  intro:
    "Hair is a personal-care product, so we can only take back hair that hasn't been used. If anything is wrong with your order, we'll put it right.",
  summary: [
    "Cancel any time before it ships",
    `Damaged or wrong item? Tell us within ${r.reportProblemHours} hours`,
    `Unused hair: return within ${r.changeOfMindDays} days`,
  ],
  sections: [
    {
      id: "cancel",
      heading: "Cancelling an order",
      blocks: [
        "You can cancel an order yourself until it ships: open it in [My orders](/account/orders) and choose **Cancel order**.",
        "If you paid online, the full amount goes back to the way you paid. If you chose cash on delivery, there's nothing to refund.",
        "Once an order has shipped it can't be cancelled, but you may be able to return it (below).",
      ],
    },
    {
      id: "damaged",
      heading: "Damaged, faulty or wrong items",
      blocks: [
        `If your order arrives damaged, faulty, or isn't what you ordered, tell us within **${r.reportProblemHours} hours of delivery**. We'll send a replacement or give you a full refund, including delivery.`,
        {
          steps: [
            "[Contact us](/contact) with your order number.",
            "Send photos of the item and the packaging, or an unboxing video if you made one.",
            "We'll reply within one working day and arrange the collection, at no cost to you.",
          ],
        },
      ],
    },
    {
      id: "change-of-mind",
      heading: "Changed your mind?",
      blocks: [
        `You can return or exchange hair within **${r.changeOfMindDays} days of delivery** if:`,
        {
          list: [
            "it hasn't been worn, washed, cut, coloured or styled",
            "it's in its original packaging, with the seal and any tags intact",
          ],
        },
        "Tell us first through [Contact us](/contact) and we'll explain how to send it back. You pay for the return delivery. When it reaches us and passes our check, we refund the price of the item (not the original delivery charge) or send the exchange.",
      ],
    },
    {
      id: "not-returnable",
      heading: "What we can't take back",
      blocks: [
        "For hygiene reasons, we can't accept returns of:",
        {
          list: [
            "wigs that have been tried on without their protective cap or worn",
            "hair that has been worn, washed, cut, coloured, heat-styled or treated",
            "items without their original packaging and seal",
          ],
        },
        "This doesn't affect your right to a refund or replacement for damaged, faulty or wrong items.",
      ],
    },
    {
      id: "refunds",
      heading: "How refunds are paid",
      blocks: [
        `Refunds go back to the way you paid (UPI, card, net banking or wallet) within **${r.refundWorkingDays} working days** of being approved. Your bank may take a few more days to show it.`,
        "You can see a refund's progress on the order in [My orders](/account/orders).",
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
