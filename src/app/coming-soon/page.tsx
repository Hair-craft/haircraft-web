import type { Metadata } from "next";
import ComingSoon from "./coming-soon";

const title = "HairCraft — Premium Hair Extensions | Coming Soon";
const description =
  "HairCraft (Hair Craft) brings premium hair extensions, crafted for length, volume and confidence. Our online store at haircraft.in is launching soon.";

/**
 * The live coming-soon page, unchanged. While the shop is closed the gate in
 * `proxy.ts` shows it at every URL, so its canonical address stays "/".
 */
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ["HairCraft", "Hair Craft", "haircraft.in", "hair extensions", "hair extensions India"],
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "https://haircraft.in",
    siteName: "HairCraft",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/images/logo.png", width: 1240, height: 1088, alt: "HairCraft logo" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/images/logo.png"],
  },
};

export default function ComingSoonPage() {
  return <ComingSoon />;
}
