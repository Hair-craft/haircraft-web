import {
  cashOnDeliveryLine,
  deliveryLine,
  paymentWindowLine,
  type ShopPolicies,
} from "@/lib/info/policies";
import { returnRules as r } from "./returns-rules";

/**
 * DRAFT — OWNER TO CONFIRM: every question and answer. Answers may use
 * `**bold**` and `[links](/path)`. The delivery and payment answers take their
 * numbers from the API's settings, so they match checkout.
 */
export interface Faq {
  question: string;
  answer: string;
}

export interface FaqGroup {
  id: string;
  heading: string;
  faqs: Faq[];
}

const care: Faq[] = [
  {
    question: "How do I choose the right length and shade?",
    answer:
      "Pick a length a little longer than your own hair for a seamless blend, and a shade that matches the middle and ends of your hair. Each product lists its lengths, colours and textures. If you're unsure, [send us a photo of your hair](/contact) and we'll suggest a match before you order. More in our [guide to choosing hair extensions](/guides/how-to-choose-hair-extensions).",
  },
  {
    question: "Is it real human hair?",
    answer:
      "Yes. Our extensions, wigs and ponytails are made from human hair, so they look, feel and move like your own, and can be washed and styled.",
  },
  {
    question: "How do I care for human hair extensions?",
    answer:
      "Wash them gently with a sulphate-free shampoo and conditioner, let them air-dry or use low heat, and brush from the ends upwards. Use a heat protectant before styling, and store clip-ins and wigs dry and untangled.",
  },
  {
    question: "How long do hair extensions last?",
    answer:
      "With good care, human hair extensions can be worn for many months. How long exactly depends on how often you wear, wash and heat-style them. Tape-ins are usually re-applied every 6–8 weeks.",
  },
  {
    question: "Can I colour, curl or straighten them?",
    answer:
      "Yes. Because it is real human hair, you can style it with heat tools, and a professional colourist can tone or darken it. Lightening isn't recommended, as it weakens the hair. Hair that has been coloured or styled can't be returned.",
  },
];

/** Questions about delivery, payment and returns use the shop's live rules. */
export function faqGroups(policies: ShopPolicies | null): FaqGroup[] {
  const cod = cashOnDeliveryLine(policies);
  return [
    {
      id: "ordering",
      heading: "Ordering and payment",
      faqs: [
        {
          question: "How can I pay?",
          answer: `Online by UPI, card, net banking or wallet, through Razorpay's secure payment window.${cod ? ` ${cod}` : ""} We never see or keep your card details.`,
        },
        {
          question: "Do prices include GST?",
          answer:
            "Yes. Every price is in Indian rupees and includes GST. What you see at checkout is what you pay.",
        },
        {
          question: "My payment failed. Was I charged?",
          answer: `${paymentWindowLine(policies)} If money left your account for an order that was cancelled, it's returned automatically by your bank or Razorpay, usually within ${r.refundWorkingDays} working days. You can try paying again from the order in [My orders](/account/orders) while it's still waiting.`,
        },
        {
          question: "Do I need an account to order?",
          answer:
            "You can fill your bag as a guest, and you sign in or create an account at checkout. Your account keeps your addresses, your orders and their tracking in one place.",
        },
      ],
    },
    {
      id: "delivery",
      heading: "Delivery",
      faqs: [
        {
          question: "How much does delivery cost?",
          answer: `${deliveryLine(policies)} See [Shipping](/shipping) for details.`,
        },
        {
          question: "How long does delivery take?",
          answer: `We pack orders within ${r.dispatchWorkingDays} working days, and most arrive ${r.deliveryWorkingDays} working days after that. You can follow your order in [My orders](/account/orders).`,
        },
        {
          question: "Do you deliver outside India?",
          answer: "Not at the moment; we deliver to addresses across India.",
        },
      ],
    },
    {
      id: "returns",
      heading: "Returns and refunds",
      faqs: [
        {
          question: "Can I cancel my order?",
          answer:
            "Yes, until it ships: open it in [My orders](/account/orders) and choose Cancel order. If you paid online, you're refunded in full.",
        },
        {
          question: "Can I return or exchange my order?",
          answer: `Unused hair in its sealed packaging can be returned or exchanged within ${r.changeOfMindDays} days of delivery. For hygiene reasons, hair or wigs that have been worn, washed, cut, coloured or styled can't be returned. See [Returns & refunds](/returns).`,
        },
        {
          question: "My order arrived damaged or wrong. What do I do?",
          answer: `Tell us within ${r.reportProblemHours} hours of delivery, with photos, and we'll replace it or refund you in full. [Here's how](/returns#damaged).`,
        },
        {
          question: "When will I get my refund?",
          answer: `Refunds go back to the way you paid within ${r.refundWorkingDays} working days of being approved; your bank may take a few more days to show it.`,
        },
      ],
    },
    { id: "hair", heading: "Choosing and caring for your hair", faqs: care },
  ];
}

/** The home page's short list (with "See all questions" below it). */
export const homeFaqs: Faq[] = [
  care[2],
  care[3],
  care[4],
  care[0],
  {
    question: "How long does delivery take?",
    answer: `We pack orders within ${r.dispatchWorkingDays} working days and deliver across India with tracking; most orders arrive ${r.deliveryWorkingDays} working days after that. See [Shipping](/shipping).`,
  },
  {
    question: "Can I return or exchange my order?",
    answer: `Unused hair in its sealed packaging can be returned within ${r.changeOfMindDays} days of delivery, and damaged or wrong items are always put right. See [Returns & refunds](/returns).`,
  },
];
