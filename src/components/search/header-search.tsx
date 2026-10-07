"use client";

import Image from "next/image";
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
export function HeaderSearch({ className }: { className?: string }) {
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
  const optionClass = (option: Option) =>
    cx(
      "flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2",
      activeOption?.id === option.id ? "bg-mint-deep" : "hover:bg-mint",
    );

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
        className="inline-flex rounded-full p-2 transition-colors hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep"
      >
        <SearchIcon />
      </Link>

      {open
        ? createPortal(
            <div
              ref={panel}
              style={{ "--search-top": `${headerBottom}px` } as CSSProperties}
              id={panelId}
              role="region"
              aria-label="Search"
              className="hc-search-panel fixed inset-0 z-40 overflow-y-auto bg-mint sm:top-(--search-top) sm:bottom-auto sm:max-h-[80vh] sm:border-b sm:border-deep/10 sm:shadow-2xl sm:shadow-deep/10"
            >
              <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
                <form
                  method="get"
                  action={routes.search}
                  role="search"
                  aria-label="Search the shop"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (q !== null) go(searchHref(q));
                  }}
                  className="flex items-center gap-3 rounded-full border border-deep/25 bg-white py-1.5 pr-1.5 pl-5 focus-within:border-deep"
                >
                  <SearchIcon
                    width={20}
                    height={20}
                    aria-hidden
                    className="shrink-0 text-deep/70"
                  />
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
                    placeholder="Search clip-ins, wigs, colours…"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActive(-1);
                    }}
                    onKeyDown={onKeyDown}
                    className="h-11 min-w-0 flex-1 bg-transparent text-lg text-deep placeholder:text-deep/45 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-11 shrink-0 rounded-full bg-deep px-5 text-sm font-medium text-mint hover:bg-deep-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => close()}
                    className="shrink-0 rounded-full p-2 hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep"
                  >
                    <CloseIcon />
                  </button>
                </form>

                <p role="status" className="sr-only">
                  {count}
                </p>

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
                    "mt-4 transition-opacity",
                    loading && "opacity-60",
                    !expanded && "hidden",
                  )}
                >
                  {shown && shown.data.categories.length > 0 ? (
                    <div role="group" aria-label="Categories" className="mb-3">
                      <p
                        aria-hidden
                        className="px-3 pb-2 text-xs tracking-[0.25em] text-deep/70 uppercase"
                      >
                        Categories
                      </p>
                      <div className="flex flex-wrap gap-2 px-1">
                        {shown.data.categories.map((category) => {
                          const option = options.find(
                            (o) => o.href === routes.category(category.slug),
                          )!;
                          return (
                            <div
                              key={category.slug}
                              {...optionProps(option)}
                              className={cx(
                                "cursor-pointer rounded-full border px-4 py-1.5 text-sm",
                                activeOption?.id === option.id
                                  ? "border-deep bg-deep text-mint"
                                  : "border-deep/20 bg-white hover:border-deep/60",
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
                      <p
                        aria-hidden
                        className="px-3 pb-1 text-xs tracking-[0.25em] text-deep/70 uppercase"
                      >
                        Products
                      </p>
                      {shown.data.products.map((product) => {
                        const option = options.find((o) => o.href === `/product/${product.slug}`)!;
                        return (
                          <div
                            key={product.slug}
                            {...optionProps(option)}
                            className={optionClass(option)}
                          >
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-mint-deep">
                              {product.image ? (
                                <Image
                                  src={product.image.thumbnail}
                                  alt=""
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">
                                <Highlighted text={product.name} query={shown.q} />
                              </span>
                              <span className="block text-sm text-deep/70">
                                {formatPriceRange(product.priceRange.min, product.priceRange.max)}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {shown && expanded ? (
                    <div
                      {...optionProps(options[options.length - 1])}
                      className={cx(optionClass(options[options.length - 1]), "mt-2 font-medium")}
                    >
                      <SearchIcon width={16} height={16} aria-hidden />
                      See all results for &ldquo;{shown.q}&rdquo;
                    </div>
                  ) : null}
                </div>

                {shown && shown.data.products.length + shown.data.categories.length === 0 ? (
                  <p className="mt-4 px-3 text-deep/70">
                    No suggestions for &ldquo;{shown.q}&rdquo;
                    {shown.data.didYouMean ? (
                      <>
                        {" "}
                        — did you mean{" "}
                        <button
                          type="button"
                          onClick={() => go(searchHref(shown.data.didYouMean!))}
                          className="font-medium text-deep underline decoration-gold decoration-2 underline-offset-4"
                        >
                          {shown.data.didYouMean}
                        </button>
                        ?
                      </>
                    ) : (
                      ". Press Enter to search anyway."
                    )}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
