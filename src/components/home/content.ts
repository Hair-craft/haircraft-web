import type { Faq } from "@/content/faq";
import { plainText } from "@/lib/info/rich-text";

/**
 * Home page wording that isn't catalogue data.
 *
 * DRAFT — OWNER TO CONFIRM: the "Why HairCraft" cards were
 * written as sensible defaults (phase S2b). They make no promises about years
 * in business, manufacturing or policies the owner hasn't confirmed; replace
 * them with your own words (or confirm them) before the shop opens. The FAQ
 * and the story live with the information pages, in `src/content/`.
 */

export interface WhyCard {
  title: string;
}

/** Short on purpose (owner, 2026-11-04: "make it minimal"). */
export const whyCards: WhyCard[] = [
  { title: "100% human hair" },
  { title: "All-day comfort" },
  { title: "Your shade & length" },
  { title: "Secure payments, tracked delivery" },
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
