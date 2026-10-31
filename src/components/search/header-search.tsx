"use client";

import Image from "next/image";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { routes } from "@/components/layout/nav";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import type { SearchSuggestions } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatPriceRange } from "@/lib/format";
import { cleanSearch, MAX_SEARCH_LENGTH, MIN_SUGGEST_LENGTH } from "@/lib/listing/query";
import { highlight } from "@/lib/search/highlight";
import { business } from "@/content/business";
import { whatsappChatHref } from "@/lib/info/contact";

/** Wait this long after the last key before asking for suggestions. */
const PAUSE_MS = 250;

const searchHref = (q: string) => `${routes.search}?q=${encodeURIComponent(q)}`;

interface Option {
  id: string;
  href: string;
  kind: "category" | "product" | "all";
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((part, i) =>
        part.match ? (
          <strong key={i} className="font-semibold">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

/**
 * The header's search: the icon opens a search bar under the header (the
 * whole screen on phones). While typing it suggests categories and products
 * (WAI combobox: ↑ ↓ move, Enter opens, Escape closes). It is a real form to
 * `/search`, and without JavaScript the icon is simply a link to that page.
 */
export function HeaderSearch({
  className,
  popular = [],
}: {
  className?: string;
  /** Categories to offer before (and beside) the suggestions: the menu's. */
  popular?: { label: string; href: string }[];
}) {
  const whatsapp = whatsappChatHref(business);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const base = useId();
  const listId = `${base}-list`;
  const panelId = `${base}-panel`;
  const trigger = useRef<HTMLAnchorElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ q: string; data: SearchSuggestions } | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  // Where the header ends, for the bar on wider screens (it opens just below).
  const [headerBottom, setHeaderBottom] = useState(0);

  // Close after navigating (React's "adjust state while rendering" pattern).
  const location = `${pathname}?${searchParams.toString()}`;
  const [shownFor, setShownFor] = useState(location);
  if (shownFor !== location) {
    setShownFor(location);
    setOpen(false);
  }

  const q = cleanSearch(query);
  const wanted = q !== null && q.length >= MIN_SUGGEST_LENGTH ? q : null;

  // Ask for suggestions after a pause; only the newest answer counts.
  useEffect(() => {
    if (!open || wanted === null) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/bff/search/suggest?q=${encodeURIComponent(wanted)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const body = response.ok ? ((await response.json()) as { data?: SearchSuggestions }) : null;
        // A closed shop, an outage or a strange answer: no suggestions, the box still searches.
        setResult(body?.data ? { q: wanted, data: body.data } : null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResult(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, PAUSE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, wanted]);

  // Focus the box on opening; follow the header as the page scrolls; close on a click outside.
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const measure = () =>
      setHeaderBottom(trigger.current?.closest("header")?.getBoundingClientRect().bottom ?? 0);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  const shown = wanted !== null && result !== null ? result : null;
  // "See all" only alongside suggestions (with none, it would lead to an empty page).
  const options: Option[] =
    shown && shown.data.categories.length + shown.data.products.length > 0
      ? [
          ...shown.data.categories.map((c) => ({
            id: `${base}-c-${c.slug}`,
            href: routes.category(c.slug),
            kind: "category" as const,
          })),
          ...shown.data.products.map((p) => ({
            id: `${base}-p-${p.slug}`,
            href: `/product/${p.slug}`,
            kind: "product" as const,
          })),
          { id: `${base}-all`, href: searchHref(wanted ?? ""), kind: "all" as const },
        ]
      : [];
  const activeOption = active >= 0 && active < options.length ? options[active] : null;
  const expanded = options.length > 0;

  const close = (returnFocus = true) => {
    setOpen(false);
    setActive(-1);
    if (returnFocus) trigger.current?.focus();
  };
  const go = (href: string) => {
    router.push(href);
    close(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && expanded) {
      event.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (event.key === "ArrowUp" && expanded) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeOption) {
      event.preventDefault();
      go(activeOption.href);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (activeOption) setActive(-1);
      else close();
    }
  };

  const optionProps = (option: Option) => ({
    id: option.id,
    role: "option" as const,
    "aria-selected": activeOption?.id === option.id,
    onMouseEnter: () => setActive(options.indexOf(option)),
    "data-href": option.href,
  });
  const count =
    shown === null
      ? ""
      : shown.data.products.length + shown.data.categories.length === 0
        ? "No suggestions. Press Enter to search."
        : `${shown.data.categories.length + shown.data.products.length} suggestions. Use the up and down arrows to choose.`;

  return (
    <div className={className}>
      <Link
        ref={trigger}
        href={routes.search}
        aria-label="Search"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          if (open) close();
          else {
            setHeaderBottom(
              event.currentTarget.closest("header")?.getBoundingClientRect().bottom ?? 0,
            );
            setOpen(true);
          }
        }}
        className="inline-flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep xl:w-60 xl:border xl:border-line xl:bg-sand xl:px-3 xl:py-1.5 xl:hover:bg-sand-deep"
      >
        <SearchIcon width={18} height={18} className="shrink-0 xl:text-[#727973]" />
        <span aria-hidden className="hidden truncate text-sm text-muted xl:inline">
          Search clip-ins, toppers, shades…
        </span>
      </Link>

      {open
        ? createPortal(
            // The dimmed backdrop; a click on it (outside the card) closes the search.
            <div
              style={{ "--search-top": `${headerBottom}px` } as CSSProperties}
              className="hc-search-panel fixed inset-0 z-40 overflow-y-auto bg-[#071b11]/55 backdrop-blur-sm sm:px-6 sm:pt-[calc(var(--search-top)+1rem)] sm:pb-10"
            >
              <div
                ref={panel}
                id={panelId}
                role="region"
                aria-label="Search"
                className="mx-auto min-h-full max-w-[1140px] overflow-hidden bg-white shadow-2xl sm:min-h-0 sm:rounded-2xl sm:border sm:border-line"
              >
                {/* The search box, on cream. */}
                <div className="border-b border-line bg-cream p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <form
                      method="get"
                      action={routes.search}
                      role="search"
                      aria-label="Search the shop"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (q !== null) go(searchHref(q));
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-deep bg-white px-3 py-2 shadow-sm sm:gap-3 sm:px-4"
                    >
                      <SearchIcon width={24} height={24} aria-hidden className="shrink-0" />
                      <input
                        ref={input}
                        type="search"
                        name="q"
                        role="combobox"
                        aria-label="Search the shop"
                        aria-autocomplete="list"
                        aria-expanded={expanded}
                        aria-controls={listId}
                        aria-activedescendant={activeOption?.id}
                        autoComplete="off"
                        maxLength={MAX_SEARCH_LENGTH}
                        placeholder="Search clip-ins, toppers, shades…"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setActive(-1);
                        }}
                        onKeyDown={onKeyDown}
                        className="h-10 min-w-0 flex-1 bg-transparent font-display text-lg font-semibold tracking-tight text-deep placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted focus:outline-none"
                      />
                      {query ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery("");
                            setActive(-1);
                            input.current?.focus();
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sand px-2 py-1 text-[0.625rem] font-semibold text-muted transition-colors hover:bg-sand-deep hover:text-deep"
                        >
                          <CloseIcon width={14} height={14} aria-hidden />
                          Clear
                        </button>
                      ) : null}
                      <span
                        aria-hidden
                        className="hidden shrink-0 rounded bg-sand-deep px-2 py-0.5 text-[0.6875rem] font-bold text-muted sm:inline-block"
                      >
                        ESC to close
                      </span>
                      <button
                        type="submit"
                        className="h-10 shrink-0 rounded-full bg-deep px-4 text-sm font-semibold text-white hover:bg-deep-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
                      >
                        Search
                      </button>
                    </form>
                    <button
                      type="button"
                      aria-label="Close search"
                      onClick={() => close()}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white shadow-sm transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
                    >
                      <CloseIcon width={22} height={22} />
                    </button>
                  </div>
                </div>

                <p role="status" className="sr-only">
                  {count}
                </p>

                <div className="grid gap-8 p-4 sm:p-6 lg:grid-cols-12">
                  {/* Left: popular categories and shade help. */}
                  <div className="flex flex-col gap-6 border-line pb-6 lg:col-span-4 lg:border-r lg:pr-6 lg:pb-0">
                    {shown && shown.data.didYouMean ? (
                      <p className="text-sm text-muted">
                        Did you mean{" "}
                        <button
                          type="button"
                          onClick={() => go(searchHref(shown.data.didYouMean!))}
                          className="font-semibold text-deep underline decoration-gold decoration-2 underline-offset-4"
                        >
                          {shown.data.didYouMean}
                        </button>
                        ?
                      </p>
                    ) : null}
                    {popular.length > 0 ? (
                      <div>
                        <p className="mb-2.5 text-[0.625rem] font-bold tracking-[0.08em] text-muted uppercase">
                          Popular categories
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {popular.map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => close(false)}
                                className="flex items-center gap-1 rounded-full bg-sand px-3 py-1 text-xs font-semibold transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
                              >
                                <span aria-hidden className="text-gold">
                                  ✦
                                </span>
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {whatsapp ? (
                      <div className="rounded-xl border border-line bg-mint p-4">
                        <p className="text-xs font-bold">Unsure of your shade?</p>
                        <p className="mt-0.5 text-xs text-muted">
                          Send us a daylight photo of your hair, and we&apos;ll help you choose.
                        </p>
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex text-xs font-bold hover:underline"
                        >
                          Free advice on WhatsApp →
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </div>
                    ) : null}
                  </div>

                  {/* Right: the suggestions (the combobox's list). */}
                  <div className="lg:col-span-8">
                    {shown === null ? (
                      <p className="py-6 text-center text-sm text-muted">
                        {wanted === null
                          ? `Type at least ${MIN_SUGGEST_LENGTH} letters to see products.`
                          : "Looking…"}
                      </p>
                    ) : null}
                    {shown && !expanded ? (
                      <p className="py-6 text-center text-sm text-muted">
                        No suggestions for &ldquo;{shown.q}&rdquo;. Press Enter to search anyway.
                      </p>
                    ) : null}
                    <div
                      id={listId}
                      role="listbox"
                      onClick={(event) => {
                        // One handler for every option (each carries its address in data-href).
                        const option = (event.target as HTMLElement).closest<HTMLElement>(
                          "[data-href]",
                        );
                        if (option?.dataset.href) go(option.dataset.href);
                      }}
                      aria-label="Suggestions"
                      className={cx(
                        "transition-opacity",
                        loading && "opacity-60",
                        !expanded && "hidden",
                      )}
                    >
                      {shown && shown.data.categories.length > 0 ? (
                        <div role="group" aria-label="Categories" className="mb-5">
                          <p
                            aria-hidden
                            className="mb-2 text-[0.625rem] font-bold tracking-[0.08em] text-muted uppercase"
                          >
                            Categories
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {shown.data.categories.map((category) => {
                              const option = options.find(
                                (o) => o.href === routes.category(category.slug),
                              )!;
                              return (
                                <div
                                  key={category.slug}
                                  {...optionProps(option)}
                                  className={cx(
                                    "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                                    activeOption?.id === option.id
                                      ? "border-deep bg-deep text-white"
                                      : "border-line bg-white hover:bg-sand",
                                  )}
                                >
                                  <Highlighted text={category.name} query={shown.q} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {shown && shown.data.products.length > 0 ? (
                        <div role="group" aria-label="Products">
                          <p aria-hidden className="mb-3 flex items-center gap-2">
                            <span className="font-display text-lg font-bold">Products</span>
                            <span className="rounded bg-sage px-2 py-0.5 text-[0.625rem] font-bold text-sage-ink">
                              {shown.data.products.length}{" "}
                              {shown.data.products.length === 1 ? "match" : "matches"}
                            </span>
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {shown.data.products.map((product) => {
                              const option = options.find(
                                (o) => o.href === `/product/${product.slug}`,
                              )!;
                              const on = activeOption?.id === option.id;
                              return (
                                <div
                                  key={product.slug}
                                  {...optionProps(option)}
                                  className={cx(
                                    "group flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all",
                                    on
                                      ? "border-deep bg-white shadow-md"
                                      : "border-line bg-sand hover:bg-white hover:shadow-md",
                                  )}
                                >
                                  <span className="flex items-start gap-3">
                                    <span className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-white shadow-inner">
                                      {product.image ? (
                                        <Image
                                          src={product.image.thumbnail}
                                          alt=""
                                          fill
                                          sizes="80px"
                                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                      ) : (
                                        <PhotoPlaceholder size="small" />
                                      )}
                                    </span>
                                    <span className="min-w-0">
                                      {product.reviewCount > 0 ? (
                                        <span className="mb-1 block text-[0.6875rem] font-bold text-gold-ink">
                                          ★ {product.rating.toFixed(1)}{" "}
                                          <span className="font-normal text-muted">
                                            ({product.reviewCount})
                                          </span>
                                        </span>
                                      ) : null}
                                      <span className="line-clamp-2 text-xs leading-snug font-bold">
                                        <Highlighted text={product.name} query={shown.q} />
                                      </span>
                                      {product.shortDescription ? (
                                        <span className="mt-1 line-clamp-1 block text-[0.6875rem] text-muted">
                                          {product.shortDescription}
                                        </span>
                                      ) : null}
                                    </span>
                                  </span>
                                  <span className="mt-2 flex items-center justify-between border-t border-line pt-3">
                                    <span className="text-base font-bold tracking-tight">
                                      {formatPriceRange(
                                        product.priceRange.min,
                                        product.priceRange.max,
                                      )}
                                    </span>
                                    <span
                                      aria-hidden
                                      className="rounded-full border border-line bg-white px-3 py-1.5 text-[0.625rem] font-bold transition-colors group-hover:bg-deep group-hover:text-white"
                                    >
                                      View
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {shown && expanded ? (
                        <div className="mt-5 flex justify-end">
                          <div
                            {...optionProps(options[options.length - 1])}
                            className={cx(
                              "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-md transition-colors sm:w-auto",
                              activeOption?.id === options[options.length - 1].id
                                ? "bg-deep-hover ring-2 ring-gold"
                                : "bg-deep hover:bg-deep-hover",
                            )}
                          >
                            <SearchIcon width={16} height={16} aria-hidden />
                            See all results for &ldquo;{shown.q}&rdquo; →
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
