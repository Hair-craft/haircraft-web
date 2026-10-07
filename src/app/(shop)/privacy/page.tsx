import type { Metadata } from "next";
import { InfoPage } from "@/components/info/info-page";
import { privacyContent } from "@/content/privacy";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal data HairCraft collects, why, who we share it with, and your rights.",
  alternates: { canonical: "/privacy" },
};

/** `/privacy` */
export default function PrivacyPage() {
  return (
    <InfoPage slug="privacy" eyebrow="Policies" title="Privacy policy" content={privacyContent()} />
  );
}
