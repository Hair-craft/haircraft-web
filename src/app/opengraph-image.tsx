import { SHARE_SIZE, shareImage } from "@/lib/seo/share-image";

/** The link preview for every page without its own (home, shop, information pages…). */
export const alt = "HairCraft: premium human hair extensions, wigs and ponytails";
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return shareImage({
    eyebrow: "Premium human hair",
    title: "Hair extensions, wigs & ponytails, crafted for you",
  });
}
