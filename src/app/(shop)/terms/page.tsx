import type { Metadata } from "next";
import { InfoPage } from "@/components/info/info-page";
import { termsContent } from "@/content/terms";
import { getShopPolicies } from "@/lib/api/shop";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using the HairCraft website and buying from us.",
  alternates: { canonical: "/terms" },
};

/** `/terms` */
export default async function TermsPage() {
  const policies = await getShopPolicies();
  return (
    <InfoPage
      slug="terms"
      eyebrow="Policies"
      title="Terms of use"
      content={termsContent(policies)}
    />
  );
}
