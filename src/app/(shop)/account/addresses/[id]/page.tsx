import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/account/account-forms";
import { AccountCard, AccountHeading } from "@/components/account/account-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { getAddresses } from "@/lib/account/api";
import { loadForAccount } from "@/lib/account/server";

export const metadata: Metadata = {
  title: "Edit address",
  robots: { index: false, follow: false },
};

/** `/account/addresses/:id`: editing one saved address. */
export default async function EditAddressPage({ params }: PageProps<"/account/addresses/[id]">) {
  const { id } = await params;
  const here = `/account/addresses/${encodeURIComponent(id)}`;
  // The API lists addresses but has no single-address call; the list is short (at most 20).
  const addresses = await loadForAccount(here, getAddresses);
  if (!addresses) return <ApiUnavailable retryHref={here} />;
  const address = addresses.find((a) => a.id === id);
  if (!address) redirect("/account/addresses?problem=gone");
  return (
    <>
      <AccountHeading title="Edit address" />
      <AccountCard>
        <AddressForm address={address} />
      </AccountCard>
    </>
  );
}
