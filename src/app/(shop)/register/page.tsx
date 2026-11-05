import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/auth-forms";
import { GoogleOr } from "@/components/auth/google-or";
import { getSignInMethods, type SignInMethods } from "@/lib/session/api";
import { safeNext } from "@/lib/session/rules";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
};

/** Which ways in are on; if the API can't say, the form without SMS or Google. */
async function methods(): Promise<SignInMethods> {
  try {
    return await getSignInMethods();
  } catch {
    return { password: true, phone: false, googleClientId: null };
  }
}

/**
 * `/register` (owner, 2026-11-04): "Continue with Google", or the form with
 * name, email, a mobile number verified with a code (while SMS codes are
 * on) and a password.
 */
export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const signInHref = `/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const on = await methods();

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

        <GoogleOr clientId={on.googleClientId} next={next} mode="register" />
        <RegisterForm next={next} smsOn={on.phone} />

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
