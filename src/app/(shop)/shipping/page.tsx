import type { Metadata } from "next";
import { InfoPage } from "@/components/info/info-page";
import { shippingContent } from "@/content/shipping";
import { getShopPolicies } from "@/lib/api/shop";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Delivery charges, times and tracking for HairCraft orders across India.",
  alternates: { canonical: "/shipping" },
};

/** `/shipping`: the charge and cash on delivery come from the API's settings (B15). */
export default async function ShippingPage() {
  const policies = await getShopPolicies();
  return (
    <InfoPage
      slug="shipping"
      eyebrow="Help"
      title="Shipping and delivery"
      content={shippingContent(policies)}
    />
  );
}
