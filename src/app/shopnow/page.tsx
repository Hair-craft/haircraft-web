import type { Metadata } from "next";
import { MetaPixel } from "./meta-pixel";
import ShopNow from "./shop-now";

const title = "Shop the Sale — HairCraft on Amazon & Flipkart";
const description =
  "HairCraft's bestselling human hair extensions are on sale now. Shop them on Amazon or Flipkart: the same products at the same sale price.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/shopnow" },
  openGraph: {
    title,
    description,
    url: "/shopnow",
    siteName: "HairCraft",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/images/logo.png", width: 1240, height: 1088, alt: "HairCraft logo" }],
  },
  twitter: { card: "summary", title, description, images: ["/images/logo.png"] },
};

/** `/shopnow`: the sale page, linking to HairCraft on Amazon and Flipkart. */
export default function ShopNowPage() {
  return (
    <>
      <MetaPixel />
      <ShopNow />
    </>
  );
}
