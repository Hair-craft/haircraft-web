import type { Faq } from "@/content/faq";
import { plainText } from "@/lib/info/rich-text";

/**
 * Home page helpers that aren't catalogue data. The "Why HairCraft" cards
 * were removed (owner, 2026-11-05). The FAQ is edited in the admin
 * (`src/lib/api/faqs.ts`), with the shop's own questions in
 * `src/content/faq.ts` as the fallback.
 */

export type { Faq } from "@/content/faq";

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
