import Image from "next/image";
import Link from "next/link";
import { LockIcon } from "@/components/ui/icons";
import { getSession } from "@/lib/session/session";

/**
 * Checkout's own, quieter frame: the logo, "Secure checkout" and a way back
 * to the bag, so nothing leads the shopper away mid-checkout. proxy.ts admits
 * only signed-in shoppers.
 */
export default async function CheckoutLayout({ children }: LayoutProps<"/">) {
  await getSession();
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-deep px-4 py-2 text-mint focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="border-b border-deep/10 bg-mint">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-deep"
          >
            <Image
              src="/images/logo.png"
              alt="HairCraft home"
              width={73}
              height={64}
              priority
              className="h-11 w-auto"
            />
          </Link>
          <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-deep/80">
            <LockIcon width={16} height={16} />
            Secure checkout
          </p>
          <Link
            href="/cart"
            className="rounded-full px-3 py-2 text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
          >
            Back to bag
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
      <footer className="mt-auto border-t border-deep/10 py-6 text-center text-xs text-deep/70">
        Questions about your order?{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-deep">
          Contact us
        </Link>
        . Prices in Indian rupees, GST included.
      </footer>
    </>
  );
}
