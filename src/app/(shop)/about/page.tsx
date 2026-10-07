import type { Metadata } from "next";
import { InfoPage } from "@/components/info/info-page";
import { aboutContent } from "@/content/about";

export const metadata: Metadata = {
  title: "About HairCraft",
  description:
    "HairCraft makes premium human hair extensions, wigs and ponytails, crafted for length, volume and confidence.",
  alternates: { canonical: "/about" },
};

/** `/about`: HairCraft's story. */
export default function AboutPage() {
  return (
    <InfoPage slug="about" eyebrow="Our story" title="About HairCraft" content={aboutContent} />
  );
}
