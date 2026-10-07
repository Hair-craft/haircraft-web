import type { Faq } from "@/content/faq";
import { plainText } from "@/lib/info/rich-text";

/**
 * Home page wording that isn't catalogue data.
 *
 * DRAFT — OWNER TO CONFIRM: the trust points and "Why HairCraft" cards were
 * written as sensible defaults (phase S2b). They make no promises about years
 * in business, manufacturing or policies the owner hasn't confirmed; replace
 * them with your own words (or confirm them) before the shop opens. The FAQ
 * and the story live with the information pages, in `src/content/`.
 */

export const trustPoints = [
  "100% human hair",
  "Every length, colour and texture",
  "Hand-checked before it ships",
  "Secure payments",
  "Delivered across India",
];

export interface WhyCard {
  eyebrow: string;
  title: string;
  text: string;
}

export const whyCards: WhyCard[] = [
  {
    eyebrow: "Real human hair",
    title: "Looks like real hair. Because it is.",
    text: "Soft, natural human hair that moves like your own, and can be washed, styled, curled and coloured.",
  },
  {
    eyebrow: "Made to be worn",
    title: "Comfortable enough for all-day wear.",
    text: "Light wefts and secure clips and tapes that sit flat, so you forget you're wearing them.",
  },
  {
    eyebrow: "Your shade, your style",
    title: "Matched to your length, colour and texture.",
    text: "Choose from many lengths, shades and textures. Not sure what suits you? Ask us before you buy.",
  },
  {
    eyebrow: "Shop with confidence",
    title: "Secure payments, tracked delivery.",
    text: "Pay by UPI, card, net banking or wallet, and follow your order from our door to yours.",
  },
];

/** The home page's short FAQ; the full list is on /faq (src/content/faq.ts). */
export type { Faq } from "@/content/faq";
export { homeFaqs as faqs } from "@/content/faq";

/** schema.org FAQPage for search engines (all answers, whatever is open on screen). */
export function faqJsonLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: plainText(faq.answer) },
    })),
  };
}
