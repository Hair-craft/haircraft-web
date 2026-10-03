import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://haircraft.in/sitemap.xml",
    host: "https://haircraft.in",
  };
}
