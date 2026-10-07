import Link from "next/link";
import { routes } from "@/components/layout/nav";
import { CloseIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import {
  activeFilters,
  clearFilters,
  listingHref,
  pageNumbers,
  withChange,
  type ListingState,
} from "@/lib/listing/query";

export interface Crumb {
  name: string;
  href: string;
}

/** Home › Shop › Clip-in Extensions › Seamless Clip-ins, plus the same trail for search engines. */
export function Breadcrumbs({ trail, siteUrl }: { trail: Crumb[]; siteUrl: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: new URL(crumb.href, siteUrl).toString(),
    })),
  };
  return (
    <nav aria-label="Breadcrumb">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
      />
      <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs tracking-[0.2em] text-deep/70 uppercase lg:justify-start">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-deep">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.href} className="hover:text-deep hover:underline">
                    {crumb.name}
                  </Link>
                  <span aria-hidden>›</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The active filters as removable chips, with Clear all. */
export function ActiveFilterChips({ base, state }: { base: string; state: ListingState }) {
  const chips = activeFilters(state);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={listingHref(base, chip.without)}
          scroll={false}
          aria-label={`Remove ${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-deep px-3 py-1.5 text-xs text-mint hover:bg-deep-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
        >
          {chip.label}
          <CloseIcon width={12} height={12} aria-hidden />
        </Link>
      ))}
      <Link
        href={listingHref(base, clearFilters(state))}
        scroll={false}
        className="px-2 text-xs font-medium tracking-[0.15em] uppercase underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
      >
        Clear all
      </Link>
    </div>
  );
}

/** Previous · 1 … 4 5 6 … 12 · Next, as real links (they work without JavaScript and for search engines). */
export function Pagination({
  base,
  state,
  totalPages,
}: {
  base: string;
  state: ListingState;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const href = (page: number) => listingHref(base, withChange(state, { page }));
  const item =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";
  return (
    <nav aria-label="Pages" className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          {state.page > 1 ? (
            <Link href={href(state.page - 1)} rel="prev" className={cx(item, "hover:bg-deep/5")}>
              ‹ Previous
            </Link>
          ) : (
            <span role="link" aria-disabled="true" className={cx(item, "text-deep/40")}>
              ‹ Previous
            </span>
          )}
        </li>
        {pageNumbers(state.page, totalPages).map((page, i) =>
          page === null ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-deep/70">
              …
            </li>
          ) : (
            <li key={page}>
              <Link
                href={href(page)}
                aria-label={`Page ${page}`}
                aria-current={page === state.page ? "page" : undefined}
                className={cx(item, page === state.page ? "bg-deep text-mint" : "hover:bg-deep/5")}
              >
                {page}
              </Link>
            </li>
          ),
        )}
        <li>
          {state.page < totalPages ? (
            <Link href={href(state.page + 1)} rel="next" className={cx(item, "hover:bg-deep/5")}>
              Next ›
            </Link>
          ) : (
            <span role="link" aria-disabled="true" className={cx(item, "text-deep/40")}>
              Next ›
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

/** Shown when the filters match nothing, or the category is empty. */
export function NoResults({ base, state }: { base: string; state: ListingState }) {
  const filtered = activeFilters(state).length > 0;
  return (
    <div role="status" className="rounded-[2rem] bg-white/70 px-8 py-16 text-center">
      <h2 className="font-display text-3xl">
        {filtered ? "No products match these filters" : "Nothing here yet"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-deep/70">
        {filtered
          ? "Try removing a filter or two: lengths, colours and textures must all be on the same product option."
          : "New pieces are on their way. In the meantime, have a look at the rest of the shop."}
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          href={filtered ? listingHref(base, clearFilters(state)) : routes.shop}
          className="inline-flex h-11 items-center rounded-full bg-deep px-6 text-sm font-medium text-mint hover:bg-deep-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
        >
          {filtered ? "Clear all filters" : "Shop all products"}
        </Link>
      </div>
    </div>
  );
}
