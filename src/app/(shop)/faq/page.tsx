import type { Metadata } from "next";
import { faqJsonLd } from "@/components/home/content";
import { FaqList } from "@/components/info/faq-list";
import { InfoPage } from "@/components/info/info-page";
import { RichText } from "@/components/info/rich-text";
import { faqGroups } from "@/content/faq";
import { getShopPolicies } from "@/lib/api/shop";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about ordering, payment, delivery, returns and caring for human hair extensions.",
  alternates: { canonical: "/faq" },
};

/** `/faq`: every question, grouped, with search engines' FAQ data. */
export default async function FaqPage() {
  const groups = faqGroups(await getShopPolicies());
  return (
    <InfoPage slug="faq" eyebrow="Help" title="Frequently asked questions">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(groups.flatMap((g) => g.faqs))).replace(/</g, "\\u003c"),
        }}
      />
      <p className="mt-6 text-lg leading-relaxed text-deep/80">
        <RichText text="Can't find your answer? Our [hair guides](/guides) go into more detail, or [contact us](/contact) and we'll help." />
      </p>
      <FaqList groups={groups} />
    </InfoPage>
  );
}
