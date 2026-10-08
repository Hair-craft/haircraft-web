import type { Metadata } from "next";
import { GuideCard } from "@/components/guides/guide-card";
import { routes } from "@/components/layout/nav";
import { Breadcrumbs } from "@/components/listing/listing-parts";
import { GUIDES } from "@/content/guides";
import { settings } from "@/lib/env";
import { itemListJsonLd } from "@/lib/seo/item-list";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { openGraph } from "@/lib/seo/open-graph";

const title = "Hair Guides: Choosing, Wearing and Caring for Human Hair";
const description =
  "Expert guides to human hair extensions, toppers and wigs: how to choose length and shade, clip-in vs tape-in vs topper, care, and wedding hair.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guides" },
  openGraph: openGraph({ title: `${title} | HairCraft`, description, url: "/guides" }),
};

/** `/guides`: every hair guide. */
export default function GuidesPage() {
  const { siteUrl } = settings();
  const list = itemListJsonLd(
    "Hair guides",
    GUIDES.map((g) => ({ name: g.title, slug: g.slug })),
    siteUrl,
  );
  // An ItemList of guides, not products: point each entry at the guide's address.
  list.itemListElement = list.itemListElement.map((item, i) => ({
    ...item,
    url: new URL(`/guides/${GUIDES[i].slug}`, siteUrl).toString(),
  }));
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(list) }} />
      <Breadcrumbs
        trail={[
          { name: "Home", href: routes.home },
          { name: "Hair guides", href: "/guides" },
        ]}
        siteUrl={siteUrl}
      />
      <header className="mt-6 max-w-2xl text-center lg:text-left">
        <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">Advice</p>
        <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">Hair guides</h1>
        <p className="mt-4 text-lg leading-relaxed text-deep/80">
          How to choose, wear and care for human hair extensions, toppers and wigs, from the
          HairCraft team.
        </p>
      </header>
      <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <GuideCard guide={guide} />
          </li>
        ))}
      </ul>
    </div>
  );
}
