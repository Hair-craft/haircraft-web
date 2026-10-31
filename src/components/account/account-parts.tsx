import Link from "next/link";
import type { ReactNode } from "react";
import { addressLines, localMobile, type Address } from "@/lib/account/rules";

/** A white rounded card, as on the sign-in pages. */
export function AccountCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white p-6 shadow-sm ${className ?? ""}`}>{children}</div>;
}

/** A page's heading and one line under it. */
export function AccountHeading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl leading-tight font-medium sm:text-[2rem] sm:leading-10">
        {title}
      </h1>
      {lead ? <p className="mt-2 text-muted">{lead}</p> : null}
    </div>
  );
}

/** An address as a block of lines (on cards and the overview). */
export function AddressText({ address }: { address: Address }) {
  return (
    <address className="not-italic">
      <p className="font-medium">{address.fullName}</p>
      {addressLines(address).map((line) => (
        <p key={line} className="text-muted">
          {line}
        </p>
      ))}
      <p className="mt-1 text-muted">Mobile: {localMobile(address.phone)}</p>
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
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="flex-1 text-muted">{children}</div>
      <Link
        href={href}
        className="self-start text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
      >
        {action}
      </Link>
    </AccountCard>
  );
}
