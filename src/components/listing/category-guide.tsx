import { GuideCard } from "@/components/guides/guide-card";
import { Blocks } from "@/components/info/info-page";
import { RichText } from "@/components/info/rich-text";
import type { CategoryGuide } from "@/content/categories";
import { findGuide } from "@/content/guides";

/**
 * The buying guide under a category's products (S15b): who it suits, how to
 * choose, care, a few questions that open in place, and related hair guides.
 */
export function CategoryGuideSection({ guide }: { guide: CategoryGuide }) {
  const related = guide.guides.map(findGuide).filter((g) => g !== null);
  return (
    <section
      aria-labelledby="buying-guide"
      className="mt-20 border-t border-deep/10 pt-14 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12"
    >
      <div aria-hidden className="hidden lg:block" />
      <div className="min-w-0">
        <div className="max-w-[68ch]">
          <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">Good to know</p>
          <h2 id="buying-guide" className="mt-3 font-display text-3xl leading-tight md:text-4xl">
            {guide.heading}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-deep/80">
            <RichText text={guide.intro} />
          </p>
          {guide.sections.map((section) => (
            <div key={section.id} className="mt-8">
              <h3 className="font-display text-2xl">{section.heading}</h3>
              <Blocks blocks={section.blocks} />
            </div>
          ))}

          <h3 className="mt-10 font-display text-2xl">Questions</h3>
          <ul className="mt-3 divide-y divide-deep/10 border-y border-deep/10">
            {guide.faqs.map((faq) => (
              <li key={faq.question}>
                <details name="category-faq" className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-medium hover:text-deep-soft focus-visible:outline-2 focus-visible:outline-deep [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span
                      aria-hidden
                      className="relative size-4 shrink-0 transition-transform duration-300 group-open:rotate-45"
                    >
                      <span className="absolute top-1/2 left-0 h-px w-4 bg-current" />
                      <span className="absolute top-0 left-1/2 h-4 w-px bg-current" />
                    </span>
                  </summary>
                  <p className="pr-8 pb-5 leading-relaxed text-deep/75">
                    <RichText text={faq.answer} />
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>

        {related.length > 0 ? (
          <>
            <h3 className="mt-12 font-display text-2xl">Hair guides</h3>
            <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((g) => (
                <li key={g.slug}>
                  <GuideCard guide={g} headingLevel={3} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
