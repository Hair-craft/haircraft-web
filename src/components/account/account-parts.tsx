import Link from "next/link";
import type { ReactNode } from "react";
import { addressLines, localMobile, type Address } from "@/lib/account/rules";

/** A white rounded card, as on the sign-in pages. */
export function AccountCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5 sm:p-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** A page's heading and one line under it. */
export function AccountHeading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
      {lead ? <p className="mt-2 text-deep/70">{lead}</p> : null}
    </div>
  );
}

/** An address as a block of lines (on cards and the overview). */
export function AddressText({ address }: { address: Address }) {
  return (
    <address className="not-italic">
      <p className="font-medium">{address.fullName}</p>
      {addressLines(address).map((line) => (
        <p key={line} className="text-deep/75">
          {line}
        </p>
      ))}
      <p className="mt-1 text-deep/75">Mobile: {localMobile(address.phone)}</p>
    </address>
  );
}

/** An overview card: a title, its content and a link to its page. */
export function OverviewCard({
  title,
  href,
  action,
  children,
}: {
  title: string;
  href: string;
  action: string;
  children: ReactNode;
}) {
  return (
    <AccountCard className="flex flex-col gap-3">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="flex-1 text-deep/80">{children}</div>
      <Link
        href={href}
        className="self-start text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
      >
        {action}
      </Link>
    </AccountCard>
  );
}
