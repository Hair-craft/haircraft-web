import type { Metadata } from "next";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/open-graph";
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
    url: "/",
    siteName: "HairCraft",
    locale: "en_IN",
    type: "website",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
};

export default function ComingSoonPage() {
  return <ComingSoon />;
}
