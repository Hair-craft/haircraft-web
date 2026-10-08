import { findGuide, GUIDES } from "@/content/guides";
import { SHARE_SIZE, shareImage } from "@/lib/seo/share-image";

/** Each guide's link preview: "Hair guide" and its title. */
export const alt = "A HairCraft hair guide";
export const size = SHARE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const guide = findGuide((await params).slug);
  return shareImage({
    eyebrow: "Hair guide",
    title: guide?.title ?? "Hair guides from HairCraft",
  });
}
