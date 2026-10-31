import Link from "next/link";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";

/** Every account page: the account menu beside (or above) the page. proxy.ts admits only signed-in shoppers. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-deep">
              Home
            </Link>
          </li>
          <li aria-hidden className="text-[#c2c8c1]">
            /
          </li>
          <li>
            <Link href="/account" className="text-deep hover:underline">
              My account
            </Link>
          </li>
        </ol>
      </nav>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-3">
          <AccountNav />
        </div>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
