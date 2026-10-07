import type { FaqGroup } from "@/content/faq";
import { RichText } from "./rich-text";

/**
 * Every question, grouped. Each is a native `<details>`, so answers open with
 * a click, the keyboard (Enter or Space) and without JavaScript, and the
 * browser's find (Ctrl+F) opens the one it matches.
 */
export function FaqList({ groups }: { groups: FaqGroup[] }) {
  return (
    <>
      <nav aria-label="Questions about" className="mt-8 print:hidden">
        <ul className="flex flex-wrap gap-2 text-sm">
          {groups.map((group) => (
            <li key={group.id}>
              <a
                href={`#${group.id}`}
                className="block rounded-full bg-white px-3.5 py-2 ring-1 ring-deep/10 hover:ring-deep/30 focus-visible:outline-2 focus-visible:outline-deep"
              >
                {group.heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={group.id} className="mt-10">
          <h2 id={group.id} className="scroll-mt-28 font-display text-2xl md:text-3xl">
            {group.heading}
          </h2>
          <ul className="mt-4 divide-y divide-deep/10 border-y border-deep/10">
            {group.faqs.map((faq) => (
              <li key={faq.question}>
                <details name={group.id} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left font-medium hover:text-deep-soft focus-visible:outline-2 focus-visible:outline-deep [&::-webkit-details-marker]:hidden">
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
        </section>
      ))}
    </>
  );
}
