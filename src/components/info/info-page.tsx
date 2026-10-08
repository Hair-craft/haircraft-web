import Link from "next/link";
import type { ReactNode } from "react";
import { INFO_PAGES, LAST_UPDATED, type InfoSlug } from "@/content/pages";
import type { Block, InfoContent, InfoSection } from "@/content/types";
import { cx } from "@/lib/cx";
import { RichText } from "./rich-text";

/** "2026-10-07" → "7 October 2026". */
export function updatedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * The reading layout shared by the seven information pages: the other pages
 * in a side list (a wrapped row of links on phones), then the title, "Last
 * updated", an optional summary box and the text.
 */
export function InfoPage({
  slug,
  eyebrow,
  title,
  content,
  children,
}: {
  slug: InfoSlug;
  eyebrow: string;
  title: string;
  content?: InfoContent;
  /** Anything after the sections (contact cards, the FAQ list). */
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16 lg:py-16">
      <nav aria-label="Help and policies" className="min-w-0 lg:pt-2 print:hidden">
        <ul className="flex flex-wrap gap-2 lg:sticky lg:top-28 lg:flex-col lg:gap-1">
          {INFO_PAGES.map((page) => {
            const current = page.slug === slug;
            return (
              <li key={page.slug}>
                <Link
                  href={page.href}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "block rounded-full px-3 py-1.5 text-xs ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-deep sm:text-sm lg:rounded-xl lg:px-3.5 lg:py-2 lg:ring-0",
                    current
                      ? "bg-deep font-medium text-mint ring-deep"
                      : "text-deep/75 ring-deep/15 hover:bg-mint hover:text-deep",
                  )}
                >
                  {page.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <article className="max-w-[68ch] min-w-0">
        <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-deep/70">
          Last updated <time dateTime={LAST_UPDATED[slug]}>{updatedDate(LAST_UPDATED[slug])}</time>
        </p>
        {content ? (
          <>
            <p className="mt-6 text-lg leading-relaxed text-deep/80">
              <RichText text={content.intro} />
            </p>
            {content.summary ? <Summary points={content.summary} /> : null}
            {content.sections.length > 1 ? <Contents sections={content.sections} /> : null}
            {content.sections.map((section) => (
              <Section key={section.id} section={section} />
            ))}
          </>
        ) : null}
        {children}
      </article>
    </div>
  );
}

function Summary({ points }: { points: string[] }) {
  return (
    <ul
      aria-label="In short"
      className="mt-8 grid gap-3 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-deep/5 sm:grid-cols-3 sm:p-6 print:border print:border-deep/20"
    >
      {points.map((point) => (
        <li key={point} className="flex gap-2.5 text-sm leading-snug font-medium">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />
          {point}
        </li>
      ))}
    </ul>
  );
}

export function Contents({ sections }: { sections: InfoSection[] }) {
  return (
    <nav aria-label="On this page" className="mt-8 print:hidden">
      <h2 className="text-xs tracking-[0.25em] text-deep-soft uppercase">On this page</h2>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-deep/75 underline decoration-deep/20 underline-offset-4 hover:text-deep hover:decoration-deep"
            >
              {section.heading}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Section({ section }: { section: InfoSection }) {
  return (
    <section aria-labelledby={section.id} className="mt-10">
      <h2 id={section.id} className="scroll-mt-28 font-display text-2xl md:text-3xl">
        {section.heading}
      </h2>
      <Blocks blocks={section.blocks} />
    </section>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return blocks.map((block, i) => {
    if (typeof block === "string")
      return (
        <p key={i} className="mt-4 leading-relaxed text-deep/80">
          <RichText text={block} />
        </p>
      );
    if ("tip" in block)
      return (
        <aside
          key={i}
          aria-label="Tip"
          className="mt-5 rounded-2xl border-l-4 border-gold bg-white/80 px-5 py-4 leading-relaxed text-deep/80 ring-1 ring-deep/5"
        >
          <span className="mr-2 text-xs font-semibold tracking-[0.2em] text-deep-soft uppercase">
            Tip
          </span>
          <RichText text={block.tip} />
        </aside>
      );
    const ordered = "steps" in block;
    const items = ordered ? block.steps : block.list;
    const List = ordered ? "ol" : "ul";
    return (
      <List
        key={i}
        className={cx(
          "mt-4 space-y-2 pl-6 leading-relaxed text-deep/80",
          ordered
            ? "list-decimal marker:font-medium marker:text-deep"
            : "list-disc marker:text-gold",
        )}
      >
        {items.map((item) => (
          <li key={item} className="pl-1">
            <RichText text={item} />
          </li>
        ))}
      </List>
    );
  });
}
