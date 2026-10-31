import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountCard } from "@/components/account/account-parts";
import { OrderCard, ProgressLine, StatusBadge } from "@/components/account/order-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { ConsultBanner } from "@/components/layout/consult-banner";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { Button, ButtonLink } from "@/components/ui/button";
import { business } from "@/content/business";
import { returnRules } from "@/content/returns-rules";
import { loadForAccount } from "@/lib/account/server";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { whatsappChatHref } from "@/lib/info/contact";
import { pageNumbers } from "@/lib/listing/query";
import { buyAgainAction } from "@/lib/orders/actions";
import { getOrderDetail, listOrders } from "@/lib/orders/api";
import {
  ORDER_FILTERS,
  orderDate,
  ordersHref,
  paymentNote,
  progressSteps,
  readOrdersQuery,
} from "@/lib/orders/rules";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

/** Orders on their way (the one featured at the top is the newest of these). */
const IN_PROGRESS = new Set(["CONFIRMED", "PROCESSING", "SHIPPED"]);

const chip =
  "inline-flex shrink-0 items-center rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";
const pageLink =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white px-3 text-sm font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";

/** The shop's real promises, under the list (src/content/returns-rules.ts). */
const promises = [
  {
    title: "Exchange for defective items",
    text: `If an item arrives defective (or isn't what you ordered), it can be exchanged within ${returnRules.exchangeDays} days of delivery, as long as it is unused.`,
  },
  {
    title: "Quick, tracked dispatch",
    text: `Orders are packed and handed to the courier in ${returnRules.dispatchWorkingDays} working days, with tracking once shipped.`,
  },
  {
    title: "Secure payments",
    text: "UPI, cards, net banking and wallets through Razorpay, or pay on delivery where offered.",
  },
  {
    title: "100% human hair",
    text: "Soft, natural human hair you can wash, style, curl and colour like your own.",
  },
];

/**
 * `/account/orders`, after the owner's design (2026-10-31): a header, the
 * status filters, the newest order still on its way (with its progress and
 * items), then every order, newest first, 20 a page.
 */
export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const query = readOrdersQuery(await searchParams);
  const here = ordersHref(query);
  const result = await loadForAccount(here, async (token) => {
    const list = await listOrders(token, query);
    // The featured order: only on the unfiltered first page.
    const active =
      query.status === null && query.page === 1
        ? list.items.find((order) => IN_PROGRESS.has(order.status))
        : undefined;
    const detail = active ? await getOrderDetail(token, active.orderNumber) : null;
    return { list, detail };
  });
  if (!result) return <ApiUnavailable retryHref={here} />;
  const { items, meta } = result.list;
  const detail = result.detail;
  // A page past the end (e.g. after cancelling): back to the last one.
  if (items.length === 0 && query.page > 1 && meta.totalPages >= 1)
    redirect(ordersHref({ ...query, page: meta.totalPages }));
  const whatsapp = whatsappChatHref(business);

  return (
    <div className="flex flex-col gap-8">
      {/* Heading, with help on WhatsApp. */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex max-w-2xl flex-col gap-1">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-sage px-3 py-1 text-[0.625rem] font-bold tracking-wider text-sage-ink uppercase">
            <span aria-hidden className="text-gold">
              ✦
            </span>
            Your orders
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-[3rem]">
            My orders
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            Newest first. Open an order to see its progress, pay or cancel.
          </p>
        </div>
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-deep"
          >
            <span aria-hidden className="size-2.5 rounded-full bg-gold" />
            <span className="flex flex-col leading-tight">
              <span className="text-[0.625rem] font-bold tracking-wider text-muted uppercase">
                Need help?
              </span>
              <span className="text-xs font-bold">WhatsApp us</span>
            </span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </div>

      {/* The status filters. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <nav aria-label="Show orders" className="-mx-1 min-w-0 overflow-x-auto px-1 pb-1">
          <ul className="flex gap-2">
            {ORDER_FILTERS.map((filter) => {
              const current = filter.value === query.status;
              return (
                <li key={filter.label}>
                  <Link
                    href={ordersHref({ status: filter.value, page: 1 })}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      chip,
                      current
                        ? "bg-deep text-white shadow-sm"
                        : "bg-sand text-muted hover:text-deep",
                    )}
                  >
                    {filter.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="text-sm text-muted">
          {meta.total} {meta.total === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* The newest order still on its way. */}
      {detail ? (
        <section
          aria-labelledby="active-order"
          className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-white p-6 shadow-md lg:p-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 right-0 size-80 rounded-full bg-gradient-to-bl from-gold/10 via-mint/20 to-transparent blur-3xl"
          />
          <div className="relative flex flex-col justify-between gap-4 border-b border-[#eee7dc] pb-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-3 animate-pulse rounded-full bg-gold ring-4 ring-gold/20"
                />
                <h2 id="active-order" className="font-display text-xl font-semibold">
                  Order {detail.orderNumber}
                </h2>
              </span>
              <span aria-hidden className="text-xs text-[#727973]">
                /
              </span>
              <span className="text-sm text-muted">Placed {orderDate(detail.placedAt)}</span>
              <span aria-hidden className="text-xs text-[#727973]">
                /
              </span>
              <span className="rounded-full bg-sage px-3 py-0.5 text-xs font-bold">
                {formatPrice(detail.grandTotal)}
                {paymentNote(detail) ? ` · ${paymentNote(detail)}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {detail.tracking ? (
                <span className="flex flex-col text-left lg:text-right">
                  <span className="text-[0.625rem] font-bold tracking-wider text-gold-ink uppercase">
                    Courier: {detail.tracking.carrier}
                  </span>
                  <span className="text-xs font-semibold">
                    Tracking: {detail.tracking.trackingNumber}
                  </span>
                </span>
              ) : null}
              <StatusBadge status={detail.status} />
            </div>
          </div>

          <div className="relative rounded-2xl bg-sand p-5 lg:p-6">
            <h3 className="mb-5 font-display text-lg font-semibold">Where your order is</h3>
            <ProgressLine steps={progressSteps(detail)} />
          </div>

          <div className="relative">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              In this order
              <span className="rounded-full bg-[#eee7dc] px-2 py-0.5 font-sans text-[0.625rem] font-normal text-[#424843]">
                {detail.items.length} {detail.items.length === 1 ? "item" : "items"}
              </span>
            </h3>
            <ul className="grid gap-4 lg:grid-cols-2">
              {detail.items.map((item) => (
                <li
                  key={`${item.productSlug}-${item.variantLabel}`}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line"
                >
                  <span className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-sand-deep">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <PhotoPlaceholder size="small" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-grow flex-col">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate font-display text-lg font-semibold">
                        {item.productName}
                      </span>
                      <span className="shrink-0 text-lg font-bold">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-1 text-sm text-muted">
                      {item.variantLabel}
                    </span>
                    <span className="mt-2 w-fit rounded bg-sage px-2 py-0.5 text-[0.625rem] font-bold text-sage-ink">
                      Qty: {item.quantity}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-[#eee7dc] pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href={`/account/orders/${encodeURIComponent(detail.orderNumber)}`}>
                View order
              </ButtonLink>
              {detail.tracking?.trackingUrl ? (
                <a
                  href={detail.tracking.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-full bg-sand px-5 text-sm font-semibold transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
                >
                  Track with {detail.tracking.carrier}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
              <form action={buyAgainAction}>
                <input type="hidden" name="orderNumber" value={detail.orderNumber} />
                <Button type="submit" variant="secondary">
                  Buy again
                </Button>
              </form>
            </div>
            <Link
              href="/returns"
              className="py-2 text-xs font-semibold text-sage-ink hover:underline focus-visible:outline-2 focus-visible:outline-deep"
            >
              Exchange policy
            </Link>
          </div>
        </section>
      ) : null}

      {/* Every order. */}
      {items.length === 0 ? (
        <AccountCard className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="font-display text-3xl font-semibold">
            {query.status ? "No orders here" : "No orders yet"}
          </p>
          <p className="text-muted">
            {query.status
              ? "Nothing with this status. Try another filter."
              : "When you place an order, it appears here with its progress."}
          </p>
          <ButtonLink href={query.status ? "/account/orders" : "/shop"}>
            {query.status ? "Show all orders" : "Start shopping"}
          </ButtonLink>
        </AccountCard>
      ) : (
        <section aria-labelledby="all-orders" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2
              id="all-orders"
              className="flex items-center gap-3 font-display text-2xl font-medium sm:text-[2rem]"
            >
              <span aria-hidden className="size-3 rounded-full bg-deep" />
              {query.status
                ? ORDER_FILTERS.find((f) => f.value === query.status)?.label
                : "All orders"}
            </h2>
          </div>
          <ul aria-label="Orders" className="flex flex-col gap-3">
            {items.map((order) => (
              <li key={order.orderNumber}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {meta.totalPages > 1 ? (
        <nav aria-label="Pages" className="flex justify-center">
          <ul className="flex flex-wrap items-center gap-2">
            {meta.hasPreviousPage ? (
              <li>
                <Link
                  href={ordersHref({ ...query, page: query.page - 1 })}
                  rel="prev"
                  className={cx(pageLink, "hover:bg-sand")}
                >
                  ‹ Previous
                </Link>
              </li>
            ) : null}
            {pageNumbers(query.page, meta.totalPages).map((page, i) =>
              page === null ? (
                <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
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
                      page === query.page ? "bg-deep text-white" : "hover:bg-sand",
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
                  className={cx(pageLink, "hover:bg-sand")}
                >
                  Next ›
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}

      {/* The shop's promises. */}
      <section
        aria-labelledby="order-promises"
        className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-white to-sand p-6 shadow-sm md:flex-row lg:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-10 size-72 rounded-full bg-gold/10 blur-2xl"
        />
        <div className="relative flex w-full shrink-0 flex-col gap-2 md:w-1/3">
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-2xl bg-deep text-xl text-gold-light shadow-sm"
          >
            ✦
          </span>
          <h2
            id="order-promises"
            className="font-display text-2xl leading-tight font-semibold sm:text-[2rem] sm:leading-10"
          >
            Our promise on every order
          </h2>
          <p className="text-sm text-muted">What you can count on, from checkout to your door.</p>
        </div>
        <ul className="relative grid w-full gap-4 sm:grid-cols-2 md:w-2/3">
          {promises.map((promise) => (
            <li key={promise.title} className="flex flex-col gap-1.5 rounded-2xl bg-white p-4">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden className="text-gold">
                  ✦
                </span>
                {promise.title}
              </span>
              <span className="text-[0.8125rem] leading-relaxed text-muted">{promise.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <ConsultBanner headingId="orders-consult-heading" />
    </div>
  );
}
