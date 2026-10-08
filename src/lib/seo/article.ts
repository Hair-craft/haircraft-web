/** schema.org `Article` for a hair guide (Google's article results). */
export function articleJsonLd(
  guide: { slug: string; title: string; summary: string; updated: string },
  siteUrl: string,
) {
  const url = new URL(`/guides/${guide.slug}`, siteUrl).toString();
  const organization = {
    "@type": "Organization",
    name: "HairCraft",
    url: new URL("/", siteUrl).toString(),
    logo: new URL("/images/logo.png", siteUrl).toString(),
  };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    url,
    mainEntityOfPage: url,
    // The site-wide share image (each guide's own image has a build-generated address).
    image: [new URL("/opengraph-image", siteUrl).toString()],
    datePublished: guide.updated,
    dateModified: guide.updated,
    author: organization,
    publisher: organization,
    inLanguage: "en-IN",
  };
}
