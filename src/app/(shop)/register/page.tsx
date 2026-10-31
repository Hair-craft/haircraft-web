import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/auth-forms";
import { business } from "@/content/business";
import { returnRules } from "@/content/returns-rules";
import { settings } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { whatsappChatHref } from "@/lib/info/contact";
import { safeNext } from "@/lib/session/rules";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
};

/** What an account gives (all of it real). */
const perks = [
  {
    mark: "1",
    title: "Follow every order",
    text: "See each order's progress from packing to your door, pay for it or cancel it.",
  },
  {
    mark: "2",
    title: "Faster checkout",
    text: "Save your delivery addresses once, and choose one when you check out.",
  },
  {
    mark: "3",
    title: "A wishlist on every device",
    text: "Save the pieces you love with the heart, and find them whenever you sign in.",
  },
  {
    mark: "4",
    title: "Reviews with photos",
    text: "Share how your hair looks and feels, to help others choose.",
  },
];

/** `/register`, after the owner's design (2026-10-31): the form beside what an account gives. */
export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const signInHref = `/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const threshold = settings().freeShippingThreshold;
  const whatsapp = whatsappChatHref(business);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-16 sm:px-6">
      <div className="flex items-center justify-between py-2 text-muted">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-wider uppercase">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-deep">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-gold opacity-60">
              /
            </li>
            <li className="text-deep">Create account</li>
          </ol>
        </nav>
        <p className="hidden items-center gap-2 rounded-full bg-sage px-3 py-1 text-[0.625rem] font-bold tracking-wider text-sage-ink uppercase sm:flex">
          <span aria-hidden>🔒</span> Secure sign-up
        </p>
      </div>

      <div className="my-6 grid items-start gap-8 lg:grid-cols-12">
        {/* The form. */}
        <div className="relative overflow-hidden rounded-xl bg-white p-8 shadow-xl sm:p-10 lg:col-span-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-60 rounded-full bg-mint opacity-60 blur-3xl"
          />
          <div className="relative flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-[0.625rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
              <span aria-hidden className="text-base text-gold-light">
                ✦
              </span>
              Join HairCraft
            </p>
            <h1 className="font-display text-2xl font-medium tracking-tight sm:text-[2rem] sm:leading-10">
              Create your account
            </h1>
            <p className="mt-1 leading-relaxed text-muted">
              Check out faster, follow your orders and keep a wishlist.
            </p>
          </div>

          {threshold !== null ? (
            <div className="relative mt-6 flex items-start gap-3.5 rounded-lg bg-sand p-4">
              <span
                aria-hidden
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-ink"
              >
                ✦
              </span>
              <span className="flex flex-col">
                <span className="text-xs font-semibold">Free shipping, every time</span>
                <span className="mt-0.5 text-sm text-muted">
                  {Number(threshold) === 0 ? (
                    "Delivery is free on every order, anywhere in India."
                  ) : (
                    <>
                      Delivery is free on orders above{" "}
                      <span className="font-bold text-deep">{formatPrice(threshold)}</span>,
                      anywhere in India.
                    </>
                  )}
                </span>
              </span>
            </div>
          ) : null}

          <div className="relative mt-8">
            <RegisterForm next={next} />
          </div>

          <p className="relative mt-6 text-center text-muted">
            Already have a HairCraft account?{" "}
            <Link
              href={signInHref}
              className="ml-1 inline-flex items-center gap-0.5 font-semibold text-deep transition-colors hover:text-gold-ink"
            >
              Sign in <span aria-hidden>→</span>
            </Link>
          </p>
        </div>

        {/* What an account gives. */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <section
            aria-labelledby="account-perks"
            className="relative flex flex-col gap-6 overflow-hidden rounded-xl bg-white p-8 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-[0.625rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
                Your account
              </p>
              <span className="rounded-full bg-mint px-2.5 py-0.5 text-[0.625rem] font-bold text-sage-ink">
                Free
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h2 id="account-perks" className="font-display text-xl font-medium">
                What your account gives you
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Everything in one place, from the first look to your doorstep.
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              {perks.map((perk) => (
                <li
                  key={perk.title}
                  className="flex items-start gap-3.5 rounded-lg bg-sand p-3 transition-transform duration-200 hover:translate-x-1"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-sage-ink"
                  >
                    {perk.mark}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs font-semibold">{perk.title}</span>
                    <span className="text-sm text-muted">{perk.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex items-center gap-5 rounded-xl bg-white p-6 shadow-xl">
            <span
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-sand text-3xl text-gold"
            >
              ✦
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-lg font-semibold">100% human hair</h2>
              <p className="text-sm leading-relaxed text-muted">
                Real human hair you can wash, style, curl and colour. Defective or not what you
                ordered? Exchange it within {returnRules.exchangeDays} days of delivery, if unused.
              </p>
            </div>
          </div>

          {whatsapp ? (
            <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-deep p-6 text-white shadow-xl">
              <div className="relative">
                <p className="text-xs font-bold">Need help before signing up?</p>
                <p className="text-sm text-gold-light">We reply on WhatsApp</p>
              </div>
              <p className="relative text-sm leading-relaxed text-white/80">
                Not sure whether a clip-in, tape-in or topper suits you? Send us a daylight photo of
                your hair and we&apos;ll help you choose.
              </p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex h-11 w-full items-center justify-center rounded-full bg-white text-xs font-bold text-deep shadow-md transition-colors hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Chat on WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
