import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/account/account-forms";
import { AccountCard, AccountHeading } from "@/components/account/account-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { getAddresses } from "@/lib/account/api";
import { MAX_ADDRESSES } from "@/lib/account/rules";
import { loadForAccount } from "@/lib/account/server";

export const metadata: Metadata = {
  title: "Add an address",
  robots: { index: false, follow: false },
};

/** `/account/addresses/new`. */
export default async function NewAddressPage() {
  const addresses = await loadForAccount("/account/addresses/new", getAddresses);
  if (!addresses) return <ApiUnavailable retryHref="/account/addresses/new" />;
  if (addresses.length >= MAX_ADDRESSES) redirect("/account/addresses");
  return (
    <>
      <AccountHeading title="Add an address" />
      <AccountCard>
        <AddressForm isFirst={addresses.length === 0} />
      </AccountCard>
    </>
  );
}
