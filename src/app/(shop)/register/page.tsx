import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/auth-forms";
import { SignInOptions } from "@/components/auth/sign-in-options";
import { getSignInMethods, type SignInMethods } from "@/lib/session/api";
import { safeNext } from "@/lib/session/rules";

/** Which ways in are on; if the API can't say, email and password (always there). */
async function methodsOrEmailOnly(): Promise<SignInMethods> {
  try {
    return await getSignInMethods();
  } catch {
    return { password: true, phone: false, googleClientId: null };
  }
}

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
};

/**
 * `/register`: just the form, with a heading and one line (owner, 2026-11-04:
 * "make it minimal"). Phone number first (a new number registers), then
 * Google, then email and password (`?method=email`).
 */
export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const signInHref = `/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const methods = await methodsOrEmailOnly();
  const others = methods.phone || Boolean(methods.googleClientId);
  const withEmail = query.method === "email" || !others;
  const keep = next ? `next=${encodeURIComponent(next)}` : "";
  const emailHref = `/register?method=email${keep ? `&${keep}` : ""}`;
  const otherHref = `/register${keep ? `?${keep}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-10 pb-20 sm:pt-14">
      <div className="relative overflow-hidden rounded-xl bg-white p-8 shadow-xl sm:p-10">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-deep via-gold-light to-deep"
        />
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem] sm:leading-10">
            Create your account
          </h1>
          <p className="text-sm text-muted">Check out faster and follow your orders.</p>
        </div>

        {withEmail ? (
          <>
            <RegisterForm next={next} />
            {others ? (
              <p className="mt-6 text-center text-sm">
                <Link
                  href={otherHref}
                  className="font-semibold text-deep underline-offset-4 transition-colors hover:text-gold-ink hover:underline"
                >
                  {methods.phone
                    ? "Register with your phone number instead"
                    : "Continue with Google instead"}
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <SignInOptions methods={methods} next={next} mode="register" emailHref={emailHref} />
        )}

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={signInHref}
            className="font-semibold text-deep transition-colors hover:text-gold-ink"
          >
            Sign in <span aria-hidden>→</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
