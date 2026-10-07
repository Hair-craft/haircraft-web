import type { Metadata } from "next";
import { AccountHeading, AddressText, OverviewCard } from "@/components/account/account-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { Button } from "@/components/ui/button";
import { getAddresses } from "@/lib/account/api";
import { listOrders } from "@/lib/orders/api";
import { orderDate, statusLabel } from "@/lib/orders/rules";
import { formatPrice } from "@/lib/format";
import { localMobile } from "@/lib/account/rules";
import { loadForAccount } from "@/lib/account/server";
import { signOutAction } from "@/lib/session/actions";
import { getProfile } from "@/lib/session/api";
import { wishlistCount } from "@/lib/wishlist/server";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

/** `/account`: the overview, with a card for each part of the account. */
export default async function AccountPage() {
  const data = await loadForAccount("/account", (token) =>
    Promise.all([
      getProfile(token),
      getAddresses(token),
      listOrders(token, { status: null, page: 1 }),
    ]),
  );
  if (!data) return <ApiUnavailable retryHref="/account" />;
  const [profile, addresses, orders] = data;
  const latest = orders.items[0];
  const saved = await wishlistCount();
  const home = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <>
      <AccountHeading
        title={`Hello, ${profile.firstName}`}
        lead="Your details, addresses and saved products, in one place."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <OverviewCard title="Profile" href="/account/profile" action="Edit profile">
          <p>{[profile.firstName, profile.lastName].filter(Boolean).join(" ")}</p>
          <p className="text-deep/70">{profile.email}</p>
          {profile.phone ? <p className="text-deep/70">{localMobile(profile.phone)}</p> : null}
        </OverviewCard>
        <OverviewCard
          title="Default address"
          href="/account/addresses"
          action={addresses.length > 0 ? "Manage addresses" : "Add an address"}
        >
          {home ? (
            <AddressText address={home} />
          ) : (
            <p className="text-deep/70">No saved addresses yet.</p>
          )}
        </OverviewCard>
        <OverviewCard title="My wishlist" href="/wishlist" action="View wishlist">
          <p>
            {saved === 0
              ? "Nothing saved yet."
              : `${saved} saved ${saved === 1 ? "product" : "products"}.`}
          </p>
        </OverviewCard>
        <OverviewCard
          title="My orders"
          href={latest ? "/account/orders" : "/shop"}
          action={latest ? "View all orders" : "Start shopping"}
        >
          {latest ? (
            <p>
              Latest: <strong>{latest.orderNumber}</strong>, {orderDate(latest.placedAt)} ·{" "}
              {formatPrice(latest.grandTotal)} · {statusLabel(latest.status)}
            </p>
          ) : (
            <p className="text-deep/70">No orders yet.</p>
          )}
        </OverviewCard>
      </div>
      <form action={signOutAction} className="mt-8 lg:hidden">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </>
  );
}
