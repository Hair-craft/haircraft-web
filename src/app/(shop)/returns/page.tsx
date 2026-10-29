import type { Metadata } from "next";
import { InfoPage } from "@/components/info/info-page";
import { returnsContent } from "@/content/returns";

export const metadata: Metadata = {
  title: "Exchange policy",
  description:
    "Exchanging a defective HairCraft item within 4 days of delivery, cancelling an order before it ships, and how refunds for cancellations are paid.",
  alternates: { canonical: "/returns" },
};

/** `/returns`: the exchange policy and cancellations. */
export default function ReturnsPage() {
  return (
    <InfoPage
      slug="returns"
      eyebrow="Help"
      title="Exchange policy and cancellations"
      content={returnsContent}
    />
  );
}
