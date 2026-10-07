import Link from "next/link";
import { routes } from "@/components/layout/nav";
import { ProductCard } from "@/components/product/product-card";
import { SearchIcon } from "@/components/ui/icons";
import { getNewArrivals, getSuggestions } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { Category } from "@/lib/api/types";
import { MAX_SEARCH_LENGTH } from "@/lib/listing/query";

/** A plain search form (works without JavaScript): the results page's box, filled in. */
export function SearchForm({ q }: { q: string | null }) {
  return (
    <form
      method="get"
      action={routes.search}
      role="search"
      className="mt-2 flex w-full max-w-xl items-center gap-2 rounded-full border border-deep/20 bg-white/80 py-1.5 pr-1.5 pl-5 focus-within:border-deep"
    >
      <SearchIcon width={18} height={18} aria-hidden className="shrink-0 text-deep/70" />
      <label className="sr-only" htmlFor="search-page-q">
        Search the shop
      </label>
      <input
        id="search-page-q"
        type="search"
        name="q"
        defaultValue={q ?? ""}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Search clip-ins, wigs, colours…"
        className="h-10 min-w-0 flex-1 bg-transparent text-base text-deep placeholder:text-deep/45 focus:outline-none"
      />
      <button
        type="submit"
        className="h-10 shrink-0 rounded-full bg-deep px-5 text-sm font-medium text-mint hover:bg-deep-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
      >
        Search
      </button>
    </form>
  );
}

/** Top-level categories that have products, as chips. */
function CategoryChips({ tree, label }: { tree: Category[] | null; label: string }) {
  const categories = (tree ?? []).filter((c) => c.productCount > 0);
  if (categories.length === 0) return null;
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={routes.category(category.slug)}
              className="inline-flex h-9 items-center rounded-full border border-deep/20 bg-white/60 px-4 text-sm hover:border-deep/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

async function quietly<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (isApiError(error)) return fallback;
    throw error;
  }
}

/** A few newest products to try instead. */
async function YouMightLike() {
  const products = (await quietly(() => getNewArrivals(4), [])).slice(0, 4);
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="might-like" className="mt-14 text-left">
      <h2 id="might-like" className="text-center font-display text-3xl">
        You might like
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Nothing matched the search: a correction if there is one, tips, categories and a few products. */
export async function SearchHelp({ q, tree }: { q: string; tree: Category[] | null }) {
  const suggestions = await quietly(() => getSuggestions(q), null);
  const didYouMean = suggestions?.didYouMean ?? null;
  return (
    <div className="rounded-[2rem] bg-white/70 px-6 py-12 text-center sm:px-10">
      {/* Announced on arrival; the tips and products below are read normally. */}
      <div role="status">
        <h2 className="font-display text-3xl">No results for &ldquo;{q}&rdquo;</h2>
      </div>
      {didYouMean ? (
        <p className="mt-4 text-lg">
          Did you mean{" "}
          <Link
            href={`${routes.search}?q=${encodeURIComponent(didYouMean)}`}
            className="font-medium text-deep underline decoration-gold decoration-2 underline-offset-4 hover:decoration-deep"
          >
            {didYouMean}
          </Link>
          ?
        </p>
      ) : null}
      <ul className="mx-auto mt-6 max-w-md list-inside list-disc space-y-1 text-left text-deep/75">
        <li>
          Check the spelling, or try a shorter word (&ldquo;wig&rdquo; rather than &ldquo;wigs for
          parties&rdquo;).
        </li>
        <li>
          Search by type, length or colour, e.g. &ldquo;clip in 20&rdquo; or &ldquo;natural
          black&rdquo;.
        </li>
        <li>Or browse a category:</li>
      </ul>
      <div className="mt-4">
        <CategoryChips tree={tree} label="Browse categories" />
      </div>
      <YouMightLike />
    </div>
  );
}

/** `/search` with nothing typed yet: the box and the categories. */
export function EmptySearch({ tree }: { tree: Category[] | null }) {
  return (
    <div className="mt-10 rounded-[2rem] bg-white/70 px-6 py-12 text-center sm:px-10">
      <h2 className="font-display text-3xl">What are you looking for?</h2>
      <p className="mt-3 text-deep/70">
        Type a product, type of extension, length or colour above, or start from a category.
      </p>
      <div className="mt-6">
        <CategoryChips tree={tree} label="Browse categories" />
      </div>
    </div>
  );
}
