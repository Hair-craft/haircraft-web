import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/auth-forms";
import { business } from "@/content/business";
import { returnRules } from "@/content/returns-rules";
import { getFeaturedReviews } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { whatsappChatHref } from "@/lib/info/contact";
import { safeNext } from "@/lib/session/rules";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

const notices: Record<string, string> = {
  ended: "Your session has ended. Please sign in again.",
};

/** What an account gives (all of it real). */
const benefits = [
  {
    title: "Follow every order",
    text: "See where each order is, from packing to your door, and pay or cancel when you need to.",
  },
  {
    title: "Faster checkout",
    text: "Save your addresses once and choose one at checkout.",
  },
  {
    title: "Your wishlist, everywhere",
    text: "Save the pieces you love and come back to them on any device.",
  },
  {
    title: "Share your look",
    text: "Review what you bought, with photos, to help others choose.",
  },
];

const promises = [
  "100% human hair",
  "Secure payments",
  `Defective? Exchanged within ${returnRules.exchangeDays} days`,
];

/** One real 5-star review for the side column (none: the card is left out). */
async function spotlight() {
  try {
    return (await getFeaturedReviews(1))[0] ?? null;
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}

/** `/sign-in`, after the owner's design (2026-10-31): the form beside why to have an account. */
export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const notice = typeof query.notice === "string" ? (notices[query.notice] ?? null) : null;
  const featured = await spotlight();
  const whatsapp = whatsappChatHref(business);

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 left-1/4 -z-10 size-96 rounded-full bg-[#c9ebd3]/20 blur-3xl"
      />
      <nav aria-label="Breadcrumb" className="pt-6 pb-6 text-xs font-semibold text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-deep">
              Home
            </Link>
          </li>
          <li aria-hidden className="text-[#727973]">
            ›
          </li>
          <li className="font-bold text-deep">Sign in</li>
        </ol>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* The form. */}
        <div className="relative overflow-hidden rounded-xl bg-white p-8 shadow-xl sm:p-10 lg:col-span-7">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-deep via-gold-light to-deep"
          />
          <div className="mb-8 flex flex-col gap-2">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-[0.625rem] font-bold tracking-[0.08em] text-sage-ink uppercase">
              <span aria-hidden>🔒</span>
              Secure sign-in
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[2rem] sm:leading-10">
              Welcome back
            </h1>
            <p className="text-sm text-muted">
              Sign in to see your orders, wishlist and saved addresses.
            </p>
          </div>

          <SignInForm next={next} notice={notice} />

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sage/40 p-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span aria-hidden className="text-gold">
                ✦
              </span>
              New to HairCraft?
            </span>
            <Link
              href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-gold-ink transition-colors hover:text-deep"
            >
              Create an account <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* Why have an account. */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <section
            aria-labelledby="why-account"
            className="relative overflow-hidden rounded-xl bg-white p-8 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-[0.625rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
                  Your account
                </p>
                <h2 id="why-account" className="font-display text-xl font-semibold">
                  Why have a HairCraft account?
                </h2>
              </div>
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-mint text-xl text-deep"
              >
                ✦
              </span>
            </div>
            <ol className="flex flex-col gap-5">
              {benefits.map((benefit, i) => (
                <li key={benefit.title} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold shadow-sm"
                  >
                    {i + 1}
                  </span>
                  <span className="flex flex-col">
                    <span className="mb-1 font-display text-lg leading-tight font-semibold">
                      {benefit.title}
                    </span>
                    <span className="text-sm text-muted">{benefit.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {featured ? (
            <figure className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-xl">
              <span
                role="img"
                aria-label={`Rated ${featured.review.rating} out of 5`}
                className="text-lg text-gold"
              >
                {"★".repeat(featured.review.rating)}
              </span>
              <blockquote className="font-display text-lg leading-relaxed italic">
                “{featured.review.body ?? featured.review.title}”
              </blockquote>
              <figcaption className="flex flex-col pt-1">
                <span className="text-xs font-bold">{featured.review.reviewerName}</span>
                <span className="text-sm text-muted">
                  {featured.review.verifiedPurchase ? "Verified purchase · " : ""}
                  {featured.product.name}
                </span>
              </figcaption>
            </figure>
          ) : null}

          <ul className="grid grid-cols-3 gap-3">
            {promises.map((promise) => (
              <li
                key={promise}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-white/80 p-3 text-center shadow-sm backdrop-blur-sm"
              >
                <span aria-hidden className="text-lg text-gold">
                  ✦
                </span>
                <span className="text-[0.625rem] leading-tight font-bold tracking-wide">
                  {promise}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Help. */}
      <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl bg-white p-6 shadow-md md:flex-row">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sage text-xl text-sage-ink"
          >
            ?
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Trouble signing in?</h2>
            <p className="text-sm text-muted">
              Reset your password by email, or ask us on WhatsApp and we&apos;ll help.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            href="/forgot-password"
            className="inline-flex h-11 items-center rounded-full bg-sand px-5 text-xs font-semibold shadow-sm transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
          >
            Reset password
          </Link>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-full bg-deep px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-deep-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
            >
              Ask on WhatsApp
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
