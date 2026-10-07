import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountCard, AccountHeading } from "@/components/account/account-parts";
import { OrderCard } from "@/components/account/order-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { ButtonLink } from "@/components/ui/button";
import { loadForAccount } from "@/lib/account/server";
import { cx } from "@/lib/cx";
import { pageNumbers } from "@/lib/listing/query";
import { listOrders } from "@/lib/orders/api";
import { ORDER_FILTERS, ordersHref, readOrdersQuery } from "@/lib/orders/rules";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

const chip =
  "inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";
const pageLink =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";

/** `/account/orders`: newest first, filterable by status, 20 a page. */
export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const query = readOrdersQuery(await searchParams);
  const here = ordersHref(query);
  const result = await loadForAccount(here, (token) => listOrders(token, query));
  if (!result) return <ApiUnavailable retryHref={here} />;
  const { items, meta } = result;
  // A page past the end (e.g. after cancelling): back to the last one.
  if (items.length === 0 && query.page > 1 && meta.totalPages >= 1)
    redirect(ordersHref({ ...query, page: meta.totalPages }));

  return (
    <>
      <AccountHeading
        title="My orders"
        lead="Newest first. Open an order to see its progress, pay or cancel."
      />
      <nav aria-label="Show orders" className="-mx-4 mb-6 overflow-x-auto px-4 pb-1">
        <ul className="flex gap-2">
          {ORDER_FILTERS.map((filter) => {
            const current = filter.value === query.status;
            return (
              <li key={filter.label}>
                <Link
                  href={ordersHref({ status: filter.value, page: 1 })}
                  aria-current={current ? "page" : undefined}
                  className={cx(chip, current ? "bg-deep text-mint" : "bg-white/70 hover:bg-white")}
                >
                  {filter.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {items.length === 0 ? (
        <AccountCard className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="font-display text-3xl">
            {query.status ? "No orders here" : "No orders yet"}
          </p>
          <p className="text-deep/70">
            {query.status
              ? "Nothing with this status. Try another filter."
              : "When you place an order, it appears here with its progress."}
          </p>
          <ButtonLink href={query.status ? "/account/orders" : "/shop"}>
            {query.status ? "Show all orders" : "Start shopping"}
          </ButtonLink>
        </AccountCard>
      ) : (
        <ul aria-label="Orders" className="flex flex-col gap-3">
          {items.map((order) => (
            <li key={order.orderNumber}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}

      {meta.totalPages > 1 ? (
        <nav aria-label="Pages" className="mt-10 flex justify-center">
          <ul className="flex flex-wrap items-center gap-1">
            {meta.hasPreviousPage ? (
              <li>
                <Link
                  href={ordersHref({ ...query, page: query.page - 1 })}
                  rel="prev"
                  className={cx(pageLink, "hover:bg-deep/5")}
                >
                  ‹ Previous
                </Link>
              </li>
            ) : null}
            {pageNumbers(query.page, meta.totalPages).map((page, i) =>
              page === null ? (
                <li key={`gap-${i}`} aria-hidden className="px-1 text-deep/70">
                  …
                </li>
              ) : (
                <li key={page}>
                  <Link
                    href={ordersHref({ ...query, page })}
                    aria-label={`Page ${page}`}
                    aria-current={page === query.page ? "page" : undefined}
                    className={cx(
                      pageLink,
                      page === query.page ? "bg-deep text-mint" : "hover:bg-deep/5",
                    )}
                  >
                    {page}
                  </Link>
                </li>
              ),
            )}
            {meta.hasNextPage ? (
              <li>
                <Link
                  href={ordersHref({ ...query, page: query.page + 1 })}
                  rel="next"
                  className={cx(pageLink, "hover:bg-deep/5")}
                >
                  Next ›
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
