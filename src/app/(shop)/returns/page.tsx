import type { Metadata } from "next";
import { InfoPage } from "@/components/info/info-page";
import { returnsContent } from "@/content/returns";

export const metadata: Metadata = {
  title: "Returns & refunds",
  description:
    "Cancelling, returning or exchanging a HairCraft order, damaged or wrong items, and how refunds are paid.",
  alternates: { canonical: "/returns" },
};

/** `/returns`: returns, refunds and cancellations. */
export default function ReturnsPage() {
  return (
    <InfoPage
      slug="returns"
      eyebrow="Help"
      title="Returns, refunds and cancellations"
      content={returnsContent}
    />
  );
}
