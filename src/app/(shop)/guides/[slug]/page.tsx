import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideCard } from "@/components/guides/guide-card";
import { Contents, Section, updatedDate } from "@/components/info/info-page";
import { routes } from "@/components/layout/nav";
import { Breadcrumbs } from "@/components/listing/listing-parts";
import { findGuide, GUIDES, readingMinutes } from "@/content/guides";
import { settings } from "@/lib/env";
import { articleJsonLd } from "@/lib/seo/article";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { openGraph } from "@/lib/seo/open-graph";
import { clip, TITLE_MAX } from "@/lib/seo/titles";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return { title: "Hair guide" };
  const path = `/guides/${guide.slug}`;
  return {
    // Long headlines are shortened for the results page; the page shows them whole.
    title: { absolute: `${clip(guide.title, TITLE_MAX - 12)} | HairCraft` },
    description: guide.summary,
    alternates: { canonical: path },
    // The guide's own share image comes from its opengraph-image file.
    openGraph: {
      ...openGraph({ title: guide.title, description: guide.summary, url: path, image: false }),
      type: "article",
    },
  };
}

/** `/guides/<slug>`: one hair guide. */
export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();
  const { siteUrl } = settings();
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd(guide, siteUrl)) }}
      />
      <Breadcrumbs
        trail={[
          { name: "Home", href: routes.home },
          { name: "Hair guides", href: "/guides" },
          { name: guide.title, href: `/guides/${guide.slug}` },
        ]}
        siteUrl={siteUrl}
      />
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
        <article className="max-w-[68ch] min-w-0">
          <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">
            Hair guide · {readingMinutes(guide)} min read
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{guide.title}</h1>
          <p className="mt-3 text-sm text-deep/70">
            Last updated <time dateTime={guide.updated}>{updatedDate(guide.updated)}</time>
          </p>
          <p className="mt-6 text-lg leading-relaxed text-deep/80">{guide.summary}</p>
          <Contents sections={guide.sections} />
          {guide.sections.map((section) => (
            <Section key={section.id} section={section} />
          ))}
        </article>

        <aside aria-label="Shop the look" className="min-w-0 print:hidden">
          <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-deep/5 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl">Shop the look</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {guide.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between gap-3 rounded-xl bg-mint px-4 py-3 font-medium transition-colors hover:bg-mint-deep focus-visible:outline-2 focus-visible:outline-deep"
                  >
                    {link.label}
                    <span aria-hidden className="text-gold-ink">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-deep/70">
              Not sure what suits you?{" "}
              <Link href="/contact" className="font-medium text-deep underline underline-offset-2">
                Ask us
              </Link>{" "}
              with a photo of your hair.
            </p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="more-guides" className="mt-16 print:hidden">
        <h2 id="more-guides" className="font-display text-3xl">
          Keep reading
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((other) => (
            <li key={other.slug}>
              <GuideCard guide={other} headingLevel={3} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
