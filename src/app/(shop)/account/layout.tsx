import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";

/** Every account page: the account menu beside (or above) the page. proxy.ts admits only signed-in shoppers. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">My account</p>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
