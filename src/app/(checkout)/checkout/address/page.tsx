import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/account/account-forms";
import { ApiUnavailable } from "@/components/api-unavailable";
import { getAddresses } from "@/lib/account/api";
import { MAX_ADDRESSES } from "@/lib/account/rules";
import { loadForAccount } from "@/lib/account/server";
import { checkoutHref, readCheckoutState } from "@/lib/checkout/rules";

export const metadata: Metadata = {
  title: "Add an address",
  robots: { index: false, follow: false },
};

/** `/checkout/address`: a new delivery address, then back to checkout with it chosen. */
export default async function CheckoutAddressPage({
  searchParams,
}: PageProps<"/checkout/address">) {
  const state = readCheckoutState(await searchParams);
  const back = checkoutHref({ ...state, address: null });
  const here = `/checkout/address${back.slice("/checkout".length)}`;
  const addresses = await loadForAccount(here, getAddresses);
  if (!addresses) return <ApiUnavailable retryHref={here} />;
  if (addresses.length >= MAX_ADDRESSES) redirect(checkoutHref(state));
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="font-display text-4xl sm:text-5xl">Add an address</h1>
      <p className="mt-2 text-deep/70">It&apos;s saved to your address book too.</p>
      <div className="mt-8 rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5 sm:p-8">
        <AddressForm isFirst={addresses.length === 0} pick back={back} here={here} />
      </div>
    </div>
  );
}
