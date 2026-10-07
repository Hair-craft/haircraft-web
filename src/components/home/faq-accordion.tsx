"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { LazyMotionProvider } from "@/components/motion/lazy";
import { useId, useState } from "react";
import { RichText } from "@/components/info/rich-text";
import { cx } from "@/lib/cx";
import type { Faq } from "./content";

/**
 * Questions that open smoothly one at a time. Each question is a button
 * (aria-expanded) controlling its answer region. The answers are also in
 * the page's FAQ structured data, so search engines see them closed or open.
 */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();
  const base = useId();

  return (
    <LazyMotionProvider>
      <ul className="mx-auto mt-10 max-w-3xl divide-y divide-deep/10 border-y border-deep/10">
        {faqs.map((faq, i) => {
          const expanded = open === i;
          return (
            <li key={faq.question}>
              <h3>
                <button
                  type="button"
                  id={`${base}-q-${i}`}
                  aria-expanded={expanded}
                  aria-controls={`${base}-a-${i}`}
                  onClick={() => setOpen(expanded ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium hover:text-deep-soft focus-visible:outline-2 focus-visible:outline-deep md:text-lg"
                >
                  {faq.question}
                  <span
                    aria-hidden
                    className={cx(
                      "relative size-5 shrink-0 transition-transform duration-300",
                      expanded && "rotate-45",
                    )}
                  >
                    <span className="absolute top-1/2 left-0 h-px w-5 bg-current" />
                    <span className="absolute top-0 left-1/2 h-5 w-px bg-current" />
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <m.div
                    id={`${base}-a-${i}`}
                    role="region"
                    aria-labelledby={`${base}-q-${i}`}
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pr-10 pb-6 leading-relaxed text-deep/75">
                      <RichText text={faq.answer} />
                    </p>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </LazyMotionProvider>
  );
}
