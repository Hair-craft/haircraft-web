import type { Metadata } from "next";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The site-wide link preview (`app/opengraph-image.tsx`). */
export const DEFAULT_SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "HairCraft: premium human hair extensions, wigs and ponytails",
};

/**
 * A page's Open Graph details with the site's defaults filled in. A page that
 * sets `openGraph` replaces the root layout's whole object, so the site name,
 * locale and (unless the page has its own) the share image are added here.
 * `image: false` leaves the image to the segment's own `opengraph-image` file.
 */
export function openGraph(fields: OpenGraph & { image?: false }): OpenGraph {
  const { image, images, ...rest } = fields;
  const shareImages = images ?? (image === false ? undefined : [DEFAULT_SHARE_IMAGE]);
  return {
    siteName: "HairCraft",
    locale: "en_IN",
    type: "website",
    ...rest,
    ...(shareImages ? { images: shareImages } : {}),
  } as OpenGraph;
}
