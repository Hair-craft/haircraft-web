import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AddressText } from "@/components/account/account-parts";
import { OrderCard, ProgressLine, StatusBadge } from "@/components/account/order-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { Button, ButtonLink } from "@/components/ui/button";
import { business } from "@/content/business";
import { getAddresses } from "@/lib/account/api";
import { localMobile } from "@/lib/account/rules";
import { loadForAccount } from "@/lib/account/server";
import { formatPrice } from "@/lib/format";
import { whatsappChatHref } from "@/lib/info/contact";
import { buyAgainAction } from "@/lib/orders/actions";
import { getOrderDetail, listOrders } from "@/lib/orders/api";
import { orderDate, progressSteps, statusLabel } from "@/lib/orders/rules";
import { signOutAction } from "@/lib/session/actions";
import { getProfile } from "@/lib/session/api";
import { wishlistCount } from "@/lib/wishlist/server";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

/** Orders still on their way (not delivered, cancelled or unpaid-and-dropped). */
const IN_PROGRESS = new Set(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"]);

function Section({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[0.625rem] font-bold tracking-[0.08em] text-gold-ink uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-xl bg-sand p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</p>
      <div>{children}</div>
    </div>
  );
}

/**
 * `/account`: after the owner's design (2026-10-31). A greeting with four
 * figures, the latest order with its progress and items, earlier orders,
 * and the saved addresses. Only real account data: no points, tiers or
 * stylists the shop doesn't have.
 */
export default async function AccountPage() {
  const data = await loadForAccount("/account", (token) =>
    Promise.all([
      getProfile(token),
      getAddresses(token),
      listOrders(token, { status: null, page: 1 }),
    ]).then(async ([profile, addresses, orders]) => {
      const latest = orders.items[0];
      const detail = latest ? await getOrderDetail(token, latest.orderNumber) : null;
      return { profile, addresses, orders, detail };
    }),
  );
  if (!data) return <ApiUnavailable retryHref="/account" />;
  const { profile, addresses, orders, detail } = data;
  const latest = orders.items[0];
  const earlier = orders.items.slice(1, 4);
  const saved = await wishlistCount();
  const inProgress = orders.items.filter((o) => IN_PROGRESS.has(o.status)).length;
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const initials =
    (profile.firstName.charAt(0) + (profile.lastName?.charAt(0) ?? "")).toUpperCase() || "?";
  const whatsapp = whatsappChatHref(business);
  const sortedAddresses = [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting and four figures. */}
      <section className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-sage/40"
        />
        <div className="relative flex flex-col justify-between gap-4 pb-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <span
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-deep font-display text-xl text-white shadow-md"
            >
              {initials}
            </span>
            <div>
              <h1 className="font-display text-2xl leading-tight font-medium sm:text-[2rem] sm:leading-10">
                Welcome back, {profile.firstName}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {name}
                <span className="mx-1.5 text-[#c2c8c1]">•</span>
                {profile.email}
                {profile.phone ? (
                  <>
                    <span className="mx-1.5 text-[#c2c8c1]">•</span>
                    {localMobile(profile.phone)}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2.5 text-xs font-semibold text-sage-ink shadow-sm transition-colors hover:bg-mint focus-visible:outline-2 focus-visible:outline-deep"
              >
                Free advice on WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
            <Link
              href="/account/profile"
              className="inline-flex items-center rounded-full bg-sand px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
            >
              Edit profile
            </Link>
          </div>
        </div>
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Orders on their way">
            <p className="font-display text-lg font-semibold">
              {inProgress === 0 ? "None right now" : `${inProgress} in progress`}
            </p>
          </Stat>
          <Stat label="Latest order">
            {latest ? (
              <>
                <p className="text-sm">
                  Latest: <strong>{latest.orderNumber}</strong>
                </p>
                <p className="mt-1 text-sm text-sage-ink">
                  {orderDate(latest.placedAt)} · {statusLabel(latest.status)}
                </p>
              </>
            ) : (
              <p className="font-display text-lg font-semibold">None yet</p>
            )}
          </Stat>
          <Stat label="My wishlist">
            <p className="font-display text-lg font-semibold">
              {saved === 0
                ? "Nothing saved yet."
                : `${saved} saved ${saved === 1 ? "product" : "products"}`}
            </p>
            <Link
              href="/wishlist"
              className="mt-1 inline-flex text-sm font-bold text-sage-ink hover:underline"
            >
              View wishlist
            </Link>
          </Stat>
          <Stat label="Saved addresses">
            <p className="font-display text-lg font-semibold">
              {addresses.length === 0
                ? "None yet"
                : `${addresses.length} ${addresses.length === 1 ? "address" : "addresses"}`}
            </p>
            <Link
              href="/account/addresses"
              className="mt-1 inline-flex text-sm font-bold text-sage-ink hover:underline"
            >
              {addresses.length > 0 ? "Manage addresses" : "Add an address"}
            </Link>
          </Stat>
        </div>
      </section>

      {/* The latest order: its progress, its items, and what can be done with it. */}
      {latest && detail ? (
        <Section
          eyebrow={IN_PROGRESS.has(detail.status) ? "Your latest order" : "Your last order"}
          title={`Order ${detail.orderNumber}`}
          action={<StatusBadge status={detail.status} />}
        >
          <p className="-mt-2 text-sm text-muted">
            Placed on {orderDate(detail.placedAt)} · Total{" "}
            <span className="font-semibold text-deep">{formatPrice(detail.grandTotal)}</span>
          </p>
          {detail.status !== "CANCELLED" ? (
            <div className="my-5 rounded-xl bg-sand p-5">
              {detail.tracking ? (
                <p className="mb-5 text-sm">
                  <span className="text-xs tracking-wider text-muted uppercase">Courier: </span>
                  <span className="font-bold">
                    {detail.tracking.carrier} ({detail.tracking.trackingNumber})
                  </span>
                  {detail.tracking.trackingUrl ? (
                    <a
                      href={detail.tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 font-semibold underline-offset-4 hover:underline"
                    >
                      Track it<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : null}
                </p>
              ) : null}
              <ProgressLine steps={progressSteps(detail)} />
            </div>
          ) : null}
          <h3 className="mt-2 text-xs font-bold tracking-wider text-muted uppercase">
            In this order ({detail.items.length} {detail.items.length === 1 ? "item" : "items"})
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {detail.items.map((item) => (
              <li
                key={`${item.productSlug}-${item.variantLabel}`}
                className="flex items-center justify-between gap-4 rounded-xl bg-sand p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white sm:size-20">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <PhotoPlaceholder size="small" />
                    )}
                  </span>
                  <span>
                    <span className="block font-display text-lg leading-snug font-semibold">
                      {item.productName}
                    </span>
                    <span className="block text-sm text-muted">{item.variantLabel}</span>
                    <span className="mt-1 block text-xs font-semibold text-muted">
                      Quantity: {item.quantity}
                    </span>
                  </span>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-bold">{formatPrice(item.lineTotal)}</span>
                  {item.listPrice !== item.unitPrice ? (
                    <span className="block text-sm text-muted line-through">
                      {formatPrice(item.listPrice)}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={`/account/orders/${encodeURIComponent(detail.orderNumber)}`}
              size="sm"
            >
              View order
            </ButtonLink>
            <form action={buyAgainAction}>
              <input type="hidden" name="orderNumber" value={detail.orderNumber} />
              <Button type="submit" variant="secondary" size="sm">
                Buy again
              </Button>
            </form>
            <Link
              href="/returns"
              className="ml-auto text-xs font-bold text-gold-ink hover:text-deep hover:underline"
            >
              Exchange policy
            </Link>
          </div>
        </Section>
      ) : null}

      {/* Earlier orders. */}
      <Section
        eyebrow="Past purchases"
        title="Order history"
        action={
          latest ? (
            <Link href="/account/orders" className="text-xs font-semibold hover:underline">
              View all orders
            </Link>
          ) : null
        }
      >
        {earlier.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {earlier.map((order) => (
              <li key={order.orderNumber}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        ) : latest ? (
          <p className="text-muted">Your earlier orders will appear here.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand p-5">
            <p className="text-muted">No orders yet.</p>
            <ButtonLink href="/shop" size="sm">
              Start shopping
            </ButtonLink>
          </div>
        )}
      </Section>

      {/* Saved addresses. */}
      <Section
        eyebrow="Address book"
        title={`Saved addresses (${addresses.length})`}
        action={
          <Link
            href="/account/addresses"
            className="inline-flex items-center rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-sage-ink transition-colors hover:bg-mint"
          >
            {addresses.length > 0 ? "Manage addresses" : "Add an address"}
          </Link>
        }
      >
        {sortedAddresses.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {sortedAddresses.slice(0, 2).map((address) => (
              <li key={address.id} className="rounded-xl bg-sand p-5 text-sm shadow-sm">
                {address.isDefault ? (
                  <span className="mb-2 inline-flex rounded-full bg-deep px-2 py-0.5 text-[0.625rem] font-bold tracking-wider text-white uppercase">
                    Default
                  </span>
                ) : null}
                <AddressText address={address} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No saved addresses yet.</p>
        )}
      </Section>

      <form action={signOutAction} className="lg:hidden">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </div>
  );
}
