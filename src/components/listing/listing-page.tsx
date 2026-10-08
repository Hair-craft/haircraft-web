import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiUnavailable } from "@/components/api-unavailable";
import { routes } from "@/components/layout/nav";
import { ProductCard } from "@/components/product/product-card";
import { findCategory, getCategories, getFilterOptions, getProducts } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { Category } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { settings } from "@/lib/env";
import { EmptySearch, SearchForm, SearchHelp } from "@/components/search/search-parts";
import {
  addressOf,
  cleanSearch,
  DEFAULT_SORT,
  hasFilters,
  listingHref,
  parseListing,
  toApiQuery,
  type SearchParams,
} from "@/lib/listing/query";
import { MobileFilters, SortSelect } from "./listing-controls";
import { ActiveFilterChips, Breadcrumbs, NoResults, Pagination, type Crumb } from "./listing-parts";
import { FilterPanel } from "./filter-panel";
import { itemListJsonLd } from "@/lib/seo/item-list";
import { openGraph } from "@/lib/seo/open-graph";
import { categoryDescription, categoryTitle } from "@/lib/seo/titles";
import { categoryGuide } from "@/content/categories";
import { CategoryGuideSection } from "./category-guide";
import { getShopPolicies } from "@/lib/api/shop";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ListingProvider, ListingResults } from "./listing-provider";

const SHOP_DESCRIPTION =
  "Clip-ins, hair toppers, tape-ins, wigs and ponytails in 100% human hair, in every length, colour and texture. Shop online with delivery across India.";

/** An API outage becomes `null` (the page shows a calm message instead of an error). */
async function load<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}

/**
 * The category for a slug, or 404 when there is none. With the API down the
 * category can't be checked, so `undefined` (the page shows the calm message).
 */
async function resolveCategory(slug: string | undefined) {
  if (slug === undefined) return { tree: await load(getCategories), found: null };
  const tree = await load(getCategories);
  if (tree === null) return { tree, found: undefined };
  const found = findCategory(tree, slug);
  if (!found) notFound();
  return { tree, found };
}

/** The search words in an address (`q`), tidied. */
const searchOf = (params: SearchParams) =>
  cleanSearch(Array.isArray(params.q) ? params.q[0] : params.q);

/** Search pages: never indexed (a shop's own search results aren't for search engines). */
export async function searchMetadata(searchParams: Promise<SearchParams>): Promise<Metadata> {
  const q = searchOf(await searchParams);
  return {
    title: q ? `Search results for “${q}”` : "Search",
    alternates: { canonical: routes.search },
    robots: { index: false, follow: true },
  };
}

export async function listingMetadata(
  categorySlug: string | undefined,
  searchParams: Promise<SearchParams>,
): Promise<Metadata> {
  const params = await searchParams;
  const { found } = await resolveCategory(categorySlug);
  const base = categorySlug ? routes.category(categorySlug) : routes.shop;
  const name = found?.category.name;
  // Filtered or re-sorted views aren't indexed on their own; their canonical is the plain list (keeping the page).
  const refined = Object.keys(params).some((key) => key !== "page");
  const page =
    typeof params.page === "string" && /^\d{1,4}$/.test(params.page) ? Number(params.page) : 1;
  const canonical = page > 1 ? `${base}?page=${page}` : base;
  const policies = await getShopPolicies();
  // Later pages say which page they are, so search results never show two identical titles.
  const pageNote = page > 1 ? ` — Page ${page}` : "";
  const title = `${name ? categoryTitle(name) : "Shop 100% Human Hair Extensions, Toppers & Wigs"}${pageNote}`;
  const description = name
    ? categoryDescription(name, found?.category.description ?? null, policies)
    : SHOP_DESCRIPTION;
  return {
    title,
    description,
    alternates: { canonical },
    // A category has its own share image (its opengraph-image file).
    openGraph: openGraph({
      title: `${title} | HairCraft`,
      description,
      url: canonical,
      ...(categorySlug ? { image: false as const } : {}),
    }),
    robots: refined ? { index: false, follow: true } : undefined,
  };
}

/**
 * `/shop` (all products), `/shop/<category>` and, with `search`, `/search?q=`:
 * heading, filters, sort, products and pages.
 */
export async function ListingPage({
  categorySlug,
  searchParams,
  search = false,
}: {
  categorySlug?: string;
  searchParams: Promise<SearchParams>;
  /** The search results page: `q` is searched, sorted by relevance by default. */
  search?: boolean;
}) {
  const params = await searchParams;
  const { productsPerPage, siteUrl } = settings();
  const { tree, found } = await resolveCategory(categorySlug);
  const base = search ? routes.search : categorySlug ? routes.category(categorySlug) : routes.shop;
  const q = search ? searchOf(params) : null;

  const trail: Crumb[] = search
    ? [
        { name: "Home", href: routes.home },
        { name: "Search", href: routes.search },
      ]
    : [
        { name: "Home", href: routes.home },
        { name: "Shop", href: routes.shop },
        ...(found
          ? [...found.ancestors, found.category].map((c) => ({
              name: c.name,
              href: routes.category(c.slug),
            }))
          : []),
      ];
  const title = search
    ? q
      ? `Results for “${q}”`
      : "Search"
    : found
      ? found.category.name
      : "Shop all";
  const eyebrow = search
    ? "Search"
    : found
      ? (found.ancestors.at(-1)?.name ?? "The collection")
      : "The collection";
  const description = search ? null : found ? found.category.description : SHOP_DESCRIPTION;

  const header = (
    <header className="flex flex-col items-center gap-3 text-center lg:items-start lg:gap-4 lg:text-left">
      <Breadcrumbs trail={trail} siteUrl={siteUrl} />
      <p className="mt-2 text-xs tracking-[0.35em] text-deep-soft uppercase lg:mt-4">{eyebrow}</p>
      <h1 className="font-display text-4xl leading-tight break-words sm:text-5xl md:text-6xl">
        {title}
      </h1>
      {description ? <p className="max-w-2xl text-deep/70">{description}</p> : null}
      {search ? (
        <SearchForm q={q} />
      ) : tree ? (
        <SubCategoryLinks tree={tree} found={found ?? null} />
      ) : null}
    </header>
  );
  const shell = (body: React.ReactNode) => (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      {header}
      {body}
    </div>
  );

  if (search && q === null) {
    // `/search?q=` and the like: the empty search page, at its one address.
    if (Object.keys(params).length > 0) redirect(routes.search);
    return shell(<EmptySearch tree={tree} />);
  }
  if (found === undefined) return shell(<ApiUnavailable retryHref={base} />);
  const options = await load(() => getFilterOptions(categorySlug, q ?? undefined));
  if (!options) return shell(<ApiUnavailable retryHref={base} />);
  const parsed = parseListing(params, options);
  // Only the search page searches: a `q` on the shop's lists is dropped (and tidied away).
  const state = search
    ? parsed
    : { ...parsed, q: null, sort: parsed.sort === "relevance" ? DEFAULT_SORT : parsed.sort };
  const result = await load(() => getProducts(toApiQuery(state, productsPerPage, categorySlug)));
  if (!result) return shell(<ApiUnavailable retryHref={base} />);

  const { total, totalPages } = result.meta;
  // A page past the end (e.g. after filters shrank the list) shows the last page instead.
  if (totalPages > 0 && state.page > totalPages)
    redirect(listingHref(base, { ...state, page: totalPages }));
  // Any other spelling of this view (`?page=1`, the plain form's `length=18&length=20&min=`,
  // unknown values) is sent to its tidy address, so each view has exactly one.
  const tidy = listingHref(base, state);
  // A category's buying guide: its own, or its nearest parent's (search has none).
  const guide =
    !search && found
      ? categoryGuide([found.category.slug, ...[...found.ancestors].reverse().map((c) => c.slug)])
      : null;
  if (tidy !== addressOf(base, params)) redirect(tidy);

  // A search that finds nothing on its own: just the help, full width (no empty filters or sort).
  if (state.q !== null && total === 0 && !hasFilters(state))
    return shell(
      <div className="mt-10">
        <SearchHelp q={state.q} tree={tree} />
      </div>,
    );

  return shell(
    <ListingProvider>
      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-12">
        <aside aria-label="Filters" className="hidden lg:block">
          <FilterPanel base={base} state={state} options={options} mode="instant" />
        </aside>
        <section aria-labelledby="results-count">
          {/* Product names are level-3 headings; this keeps the outline in order. */}
          <h2 className="sr-only">Products</h2>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-deep/10 pb-4">
            <p id="results-count" role="status" className="text-sm text-deep/70">
              {total} {total === 1 ? "product" : "products"}
            </p>
            <div className="flex items-center gap-3">
              <MobileFilters base={base} state={state} options={options} />
              <SortSelect base={base} state={state} />
            </div>
          </div>
          <div className="mt-4">
            <ActiveFilterChips base={base} state={state} />
          </div>
          <ListingResults>
            {!search && result.items.length > 0 ? (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: jsonLdScript(
                    itemListJsonLd(
                      title,
                      result.items,
                      siteUrl,
                      (state.page - 1) * productsPerPage + 1,
                    ),
                  ),
                }}
              />
            ) : null}
            {result.items.length === 0 ? (
              <div className="mt-6">
                <NoResults base={base} state={state} />
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
                {result.items.map((product, i) => (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      priority={i < 4}
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 26vw, (min-width: 640px) 31vw, 46vw"
                    />
                  </li>
                ))}
              </ul>
            )}
            <Pagination base={base} state={state} totalPages={totalPages} />
          </ListingResults>
        </section>
      </div>
      {/* The category's buying guide, on its first page only (later pages would repeat it). */}
      {guide && state.page === 1 ? <CategoryGuideSection guide={guide} /> : null}
    </ListingProvider>,
  );
}

/**
 * Chips for moving around the category tree: on /shop the top-level
 * categories; on a category its sub-categories; on a sub-category its
 * siblings. Only categories with products are offered.
 */
function SubCategoryLinks({
  tree,
  found,
}: {
  tree: Category[];
  found: { category: Category; ancestors: Category[] } | null;
}) {
  const parent = found
    ? found.category.children.length > 0
      ? found.category
      : found.ancestors.at(-1)
    : null;
  const items = (parent ? parent.children : tree).filter((c) => c.productCount > 0);
  if (items.length === 0) return null;
  const all = parent
    ? {
        name: `All ${parent.name}`,
        href: routes.category(parent.slug),
        current: found?.category.slug === parent.slug,
      }
    : { name: "All", href: routes.shop, current: true };
  const links = [
    all,
    ...items.map((c) => ({
      name: c.name,
      href: routes.category(c.slug),
      current: found?.category.slug === c.slug,
    })),
  ];
  return (
    <nav aria-label={parent ? `${parent.name} types` : "Shop by category"} className="mt-2">
      <ul className="flex flex-wrap justify-center gap-2 lg:justify-start">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className={cx(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
                link.current
                  ? "border-deep bg-deep text-mint"
                  : "border-deep/20 bg-white/60 hover:border-deep/60",
              )}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
