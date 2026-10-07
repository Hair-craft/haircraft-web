import { findCategory, getCategories, getProducts } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { SHARE_SIZE, shareImage, sharePhoto } from "@/lib/seo/share-image";

/** A category's link preview: its name and its first product's photo. */
export const alt = "A HairCraft collection";
export const size = SHARE_SIZE;
export const contentType = "image/png";
// Made when first asked for, then cached with the catalogue (categories change rarely).
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  let name: string | null = null;
  let photo: string | null = null;
  try {
    const found = findCategory(await getCategories(), slug);
    name = found?.category.name ?? null;
    if (found)
      photo = await sharePhoto(
        (await getProducts({ category: slug, limit: 1 })).items[0]?.image?.large,
      );
  } catch (error) {
    // The API being down gives the plain design.
    if (!isApiError(error)) throw error;
  }
  return shareImage({
    eyebrow: name ? "The collection" : "Premium human hair",
    title: name ? `Human hair ${name.toLowerCase()}` : "Hair extensions, wigs & ponytails",
    photo,
  });
}
