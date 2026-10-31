"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { productHref } from "@/components/product/product-card";
import { PriceRange } from "@/components/ui/display";
import type { ProductCard } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { matchApiHref, matchShopHref, swatchFor, type MatchChoice } from "./match";

export interface MatcherGoal {
  /** Category slug. */
  slug: string;
  label: string;
}

interface Answer {
  product: ProductCard | null;
  total: number;
  choice: MatchChoice;
  exact: boolean;
}

const pill =
  "rounded-2xl px-3.5 py-3 text-left text-xs font-semibold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";
const on = "bg-deep text-white";
const off = "bg-sand text-deep hover:bg-sand-deep";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-deep font-sans text-[0.65rem] text-white"
        >
          {n}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Three steps (goal, texture, shade) and a panel with the best-rated real
 * product that matches, from `/bff/match`. Each step is a group of toggle
 * buttons (aria-pressed); choosing again clears it. The panel is a live
 * region, so the new match is read out.
 */
export function ShadeMatcher({
  goals,
  textures,
  colors,
}: {
  goals: MatcherGoal[];
  textures: string[];
  colors: string[];
}) {
  const [choice, setChoice] = useState<MatchChoice>({
    category: goals[0]?.slug ?? null,
    texture: null,
    color: null,
  });
  // The last reply, and which address it answered: a reply for another
  // address means the current one is still loading.
  const [reply, setReply] = useState<{ href: string; answer: Answer | null } | null>(null);
  const href = matchApiHref(choice);

  useEffect(() => {
    const controller = new AbortController();
    fetch(href, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((body: { data: Answer }) => setReply({ href, answer: body.data }))
      .catch(() => {
        if (!controller.signal.aborted) setReply({ href, answer: null });
      });
    return () => controller.abort();
  }, [href]);

  // While loading, the previous match stays (dimmed).
  const answer = reply?.answer ?? null;
  const state = reply?.href !== href ? "loading" : answer ? "done" : "failed";

  const pick = (key: keyof MatchChoice, value: string) =>
    setChoice((current) => ({ ...current, [key]: current[key] === value ? null : value }));

  const product = answer?.product ?? null;
  return (
    <div className="grid items-start gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-7 lg:col-span-8">
        {goals.length > 0 ? (
          <Step n={1} title="What are you shopping for?">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {goals.map((goal) => (
                <button
                  key={goal.slug}
                  type="button"
                  aria-pressed={choice.category === goal.slug}
                  onClick={() => pick("category", goal.slug)}
                  className={cx(pill, choice.category === goal.slug ? on : off)}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </Step>
        ) : null}
        {textures.length > 0 ? (
          <Step n={2} title="Choose your texture">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {textures.map((texture) => (
                <button
                  key={texture}
                  type="button"
                  aria-pressed={choice.texture === texture}
                  onClick={() => pick("texture", texture)}
                  className={cx(pill, "text-center", choice.texture === texture ? on : off)}
                >
                  {texture}
                </button>
              ))}
            </div>
          </Step>
        ) : null}
        {colors.length > 0 ? (
          <Step n={3} title="Choose the closest shade">
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => {
                const chosen = choice.color === color;
                return (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => pick("color", color)}
                    className={cx(
                      "flex items-center gap-2.5 rounded-full py-2 pr-3.5 pl-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
                      chosen
                        ? "bg-deep text-white shadow-sm"
                        : "bg-sand text-deep hover:bg-sand-deep",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cx(
                        "size-7 rounded-full shadow-inner ring-1 ring-black/10",
                        chosen && "ring-2 ring-gold",
                      )}
                      style={{ background: swatchFor(color) }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>
          </Step>
        ) : null}
      </div>

      <div
        aria-live="polite"
        aria-busy={state === "loading"}
        data-testid="match-panel"
        className="flex flex-col gap-4 rounded-2xl bg-sand p-6 shadow-sm lg:col-span-4"
      >
        <p className="text-[0.65rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
          {answer && !answer.exact && product ? "Your closest match" : "Your match"}
        </p>
        {state === "failed" ? (
          <p className="text-sm text-muted">
            We couldn&apos;t look that up just now. Please try again in a moment.
          </p>
        ) : product ? (
          <>
            <Link
              href={productHref(product.slug)}
              className={cx(
                "group flex flex-col gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep",
                state === "loading" && "opacity-60",
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white">
                {product.image ? (
                  <Image
                    src={product.image.medium}
                    alt={product.imageAlt ?? product.name}
                    fill
                    sizes="(min-width: 1024px) 22rem, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <PhotoPlaceholder />
                )}
              </div>
              <span className="font-display text-lg leading-snug font-semibold group-hover:text-gold-ink">
                {product.name}
              </span>
              <PriceRange
                min={product.priceRange.min}
                max={product.priceRange.max}
                className="text-base font-bold"
              />
            </Link>
            {answer && !answer.exact ? (
              <p className="text-sm text-muted">
                Nothing matches every choice yet, so here is the nearest.
              </p>
            ) : null}
            <Link
              href={productHref(product.slug)}
              className="flex h-11 items-center justify-center rounded-full bg-deep text-sm font-semibold text-white shadow-md transition-colors hover:bg-deep-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
            >
              View this match
            </Link>
            {answer && answer.total > 1 ? (
              <Link
                href={matchShopHref(answer.choice)}
                className="text-center text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-deep"
              >
                See all {answer.total} matches
              </Link>
            ) : null}
          </>
        ) : state === "done" ? (
          <p className="text-sm text-muted">
            Nothing to show here yet. Ask us on WhatsApp and we&apos;ll help you choose.
          </p>
        ) : (
          <div aria-hidden className="aspect-[4/3] animate-pulse rounded-xl bg-white" />
        )}
      </div>
    </div>
  );
}
