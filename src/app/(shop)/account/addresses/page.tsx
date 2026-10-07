import type { Metadata } from "next";
import { AddressActions } from "@/components/account/account-forms";
import { AccountCard, AccountHeading, AddressText } from "@/components/account/account-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { Badge } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import type { AddressProblem } from "@/lib/account/actions";
import { getAddresses } from "@/lib/account/api";
import { MAX_ADDRESSES } from "@/lib/account/rules";
import { loadForAccount } from "@/lib/account/server";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

/** The shop's own words for each problem code (the address bar carries only the code). */
const PROBLEMS: Record<AddressProblem, string> = {
  gone: "That address no longer exists. It may have been deleted elsewhere.",
  unavailable: "We can't reach the shop at the moment. Please try again in a minute.",
  failed: "That didn't work. Please try again.",
};

/** `/account/addresses`: the address book. */
export default async function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  const { problem } = await searchParams;
  const addresses = await loadForAccount("/account/addresses", getAddresses);
  if (!addresses) return <ApiUnavailable retryHref="/account/addresses" />;
  const note =
    typeof problem === "string" && Object.hasOwn(PROBLEMS, problem)
      ? PROBLEMS[problem as AddressProblem]
      : null;
  const full = addresses.length >= MAX_ADDRESSES;

  return (
    <>
      <AccountHeading
        title="Addresses"
        lead="Where we deliver. Your default is chosen first at checkout."
      />
      {note ? (
        <p
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {note}
        </p>
      ) : null}
      {addresses.length === 0 ? (
        <AccountCard className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="font-display text-3xl">No saved addresses yet</p>
          <p className="text-deep/70">Add one now, and checkout will be quicker.</p>
          <ButtonLink href="/account/addresses/new">Add address</ButtonLink>
        </AccountCard>
      ) : (
        <>
          <ul aria-label="Saved addresses" className="grid gap-5 md:grid-cols-2">
            {addresses.map((address) => (
              <li key={address.id}>
                <AccountCard className="flex h-full flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-2xl">{address.label ?? "Address"}</p>
                    {address.isDefault ? <Badge tone="gold">Default</Badge> : null}
                  </div>
                  <div className="flex-1">
                    <AddressText address={address} />
                  </div>
                  <AddressActions address={address} />
                </AccountCard>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {full ? (
              <p className="text-sm text-deep/70">
                You&apos;ve saved {MAX_ADDRESSES} addresses, the most we keep. Delete one you no
                longer use to add another.
              </p>
            ) : (
              <ButtonLink href="/account/addresses/new">Add address</ButtonLink>
            )}
          </div>
        </>
      )}
    </>
  );
}
