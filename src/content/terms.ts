import { gstLine, paymentWindowLine, type ShopPolicies } from "@/lib/info/policies";
import { business, sellerName } from "./business";
import type { InfoContent } from "./types";

/**
 * DRAFT — FOR A QUALIFIED (LEGAL) REVIEW BEFORE LAUNCH. Written from how the
 * shop really works (orders, payment, cancelling, reviews) and the Consumer
 * Protection (E-Commerce) Rules 2020. It is not legal advice; the governing
 * courts' city is the owner's to fill in.
 */
export function termsContent(policies: ShopPolicies | null): InfoContent {
  const seller = sellerName();
  return {
    intro: `These terms apply when you use this website or buy from ${seller}. By creating an account or placing an order, you agree to them. Please read them with our [Privacy policy](/privacy) and [Returns & refunds](/returns) policy.`,
    sections: [
      {
        id: "seller",
        heading: "Who you're buying from",
        blocks: [
          `This shop is run by ${seller}${business.address ? `, ${business.address.join(", ")}` : ""}${business.gstin ? ` (GSTIN ${business.gstin})` : ""}. You can contact us at [${business.email}](mailto:${business.email}) or through the [Contact](/contact) page.`,
        ],
      },
      {
        id: "account",
        heading: "Your account",
        blocks: [
          "You need an account to place an order. Please give accurate details, keep your password to yourself, and tell us if you think someone else has used your account. You must be 18 or over to buy, or use the shop with a parent's or guardian's permission.",
        ],
      },
      {
        id: "products",
        heading: "Products and prices",
        blocks: [
          "We describe and photograph our products as accurately as we can, but colours can look different on different screens, and because it's natural hair, each piece can vary slightly.",
          `${gstLine(policies)} The delivery charge, if any, is shown before you pay.`,
          "If a price on the website is clearly wrong, we'll tell you before shipping and you can cancel for a full refund.",
        ],
      },
      {
        id: "orders",
        heading: "Orders and payment",
        blocks: [
          "Your order is accepted when we confirm it by showing its order number. We reserve the stock for you at that moment.",
          `Online payments are handled securely by Razorpay. ${paymentWindowLine(policies)}`,
          "We may cancel an order, with a full refund, if an item turns out to be out of stock, a price was wrong, we can't deliver to the address, or we suspect fraud. We'll tell you why.",
        ],
      },
      {
        id: "delivery",
        heading: "Delivery",
        blocks: [
          "We deliver within India. Delivery times are estimates; see [Shipping](/shipping). The products are your responsibility once delivered to the address you gave.",
        ],
      },
      {
        id: "cancel-return",
        heading: "Cancelling, returns and refunds",
        blocks: [
          "You can cancel an order until it ships. Returns, exchanges and refunds follow our [Returns & refunds](/returns) policy, which is part of these terms. Nothing in these terms takes away your rights under consumer law.",
        ],
      },
      {
        id: "reviews",
        heading: "Reviews and photos you post",
        blocks: [
          "Reviews must be honest, about the product, and your own, without offensive content or other people's personal details. Photos must be yours to share and show only the product, yourself, or people who have agreed.",
          "We check every review before it appears and may decline any that don't follow these rules. By posting, you allow us to show your review and photos on this website, with your first name and the first letter of your surname. You can edit or delete them in [My reviews](/account/reviews).",
        ],
      },
      {
        id: "use",
        heading: "Using the website",
        blocks: [
          "Please don't misuse the website: for example, by trying to break into it or other people's accounts, overloading it, or copying its content to sell. The website's text, photos and design belong to us or our suppliers.",
        ],
      },
      {
        id: "liability",
        heading: "Our responsibility to you",
        blocks: [
          "We're responsible for losses that are a foreseeable result of us breaking these terms, up to the amount you paid for the order concerned. We're not responsible for losses we couldn't reasonably have prevented, such as courier delays or events beyond our control. This doesn't limit anything the law doesn't allow us to limit.",
        ],
      },
      {
        id: "complaints",
        heading: "Complaints and disputes",
        blocks: [
          "If something goes wrong, [contact us](/contact) first; most problems are sorted quickly. You can also write to our grievance officer ([details](/contact#grievance)), who will acknowledge your complaint within 48 hours and aim to resolve it within one month.",
          "These terms are governed by the laws of India, and disputes are settled by the courts of India.",
        ],
      },
      {
        id: "changes",
        heading: "Changes to these terms",
        blocks: [
          "We may update these terms from time to time; the date at the top shows when. The terms in force when you placed an order apply to that order.",
        ],
      },
    ],
  };
}
