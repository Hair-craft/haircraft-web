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
        className="sr-only z-50 rounded-full bg-deep px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="bg-white/95 shadow-[0_4px_20px_rgba(11,41,26,0.06)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-deep"
          >
            <Image
              src="/images/logo.png"
              alt="HairCraft home"
              width={73}
              height={64}
              priority
              className="h-9 w-auto"
            />
            <span aria-hidden className="hidden flex-col sm:flex">
              <span className="font-display text-xl leading-none font-semibold tracking-tight">
                HairCraft
              </span>
              <span className="mt-1 text-[0.625rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
                Luxury Human Hair Co.
              </span>
            </span>
          </Link>
          <p className="flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-sage-ink">
            <LockIcon width={14} height={14} />
            Secure checkout
          </p>
          <Link
            href="/cart"
            className="rounded-full bg-sand px-4 py-2 text-xs font-semibold transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
          >
            Back to bag
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
      <footer className="mt-auto bg-cream py-6 text-center text-xs text-muted">
        Questions about your order?{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-deep">
          Contact us
        </Link>
        . Prices in Indian rupees, GST included.
      </footer>
    </>
  );
}
