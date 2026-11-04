import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/auth-forms";
import { SignInOptions } from "@/components/auth/sign-in-options";
import { getSignInMethods, type SignInMethods } from "@/lib/session/api";
import { safeNext } from "@/lib/session/rules";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

const notices: Record<string, string> = {
  ended: "Your session has ended. Please sign in again.",
};

/** Which ways in are on; if the API can't say, email and password (always there). */
async function methodsOrEmailOnly(): Promise<SignInMethods> {
  try {
    return await getSignInMethods();
  } catch {
    return { password: true, phone: false, googleClientId: null };
  }
}

/**
 * `/sign-in`: just the form, with a heading and one line (owner, 2026-11-04:
 * "make it minimal"). Phone code first, then Google, then email and password
 * (`?method=email`), as the owner chose on 2026-11-04.
 */
export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const notice = typeof query.notice === "string" ? (notices[query.notice] ?? null) : null;
  const methods = await methodsOrEmailOnly();
  const others = methods.phone || Boolean(methods.googleClientId);
  const withEmail = query.method === "email" || !others;
  const keep = next ? `next=${encodeURIComponent(next)}` : "";
  const emailHref = `/sign-in?method=email${keep ? `&${keep}` : ""}`;
  const otherHref = `/sign-in${keep ? `?${keep}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-10 pb-20 sm:pt-14">
      <div className="relative overflow-hidden rounded-xl bg-white p-8 shadow-xl sm:p-10">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-deep via-gold-light to-deep"
        />
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem] sm:leading-10">
            Welcome back
          </h1>
          <p className="text-sm text-muted">Sign in to see your orders and wishlist.</p>
        </div>

        {withEmail ? (
          <>
            <SignInForm next={next} notice={notice} />
            {others ? (
              <p className="mt-6 text-center text-sm">
                <Link
                  href={otherHref}
                  className="font-semibold text-deep underline-offset-4 transition-colors hover:text-gold-ink hover:underline"
                >
                  {methods.phone ? "Use your phone number instead" : "Continue with Google instead"}
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <>
            {notice ? (
              <p role="status" className="mb-5 rounded-2xl bg-mint-deep px-4 py-3 text-sm">
                {notice}
              </p>
            ) : null}
            <SignInOptions methods={methods} next={next} mode="sign-in" emailHref={emailHref} />
          </>
        )}

        <p className="mt-8 text-center text-sm text-muted">
          New to HairCraft?{" "}
          <Link
            href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-deep transition-colors hover:text-gold-ink"
          >
            Create an account <span aria-hidden>→</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
