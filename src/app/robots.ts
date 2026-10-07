import type { MetadataRoute } from "next";
import { settings } from "@/lib/env";
import { robotsFor } from "@/lib/seo/robots";

// Read when the server runs (ALLOW_INDEXING and SITE_URL are runtime settings).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const { siteUrl, allowIndexing } = settings();
  return robotsFor({ siteUrl, allowIndexing });
}
