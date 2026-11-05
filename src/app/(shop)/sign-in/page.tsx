import type { Metadata } from "next";
import Link from "next/link";
import { GoogleOr } from "@/components/auth/google-or";
import { SignInChoice } from "@/components/auth/sign-in-choice";
import { getSignInMethods, type SignInMethods } from "@/lib/session/api";
import { safeNext } from "@/lib/session/rules";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

const notices: Record<string, string> = {
  ended: "Your session has ended. Please sign in again.",
};

/** Which ways in are on; if the API can't say, the password form alone. */
async function methods(): Promise<SignInMethods> {
  try {
    return await getSignInMethods();
  } catch {
    return { password: true, phone: false, googleClientId: null };
  }
}

/**
 * `/sign-in` (owner, 2026-11-04/05): "Continue with Google", or a toggle
 * between the email or phone number with the password, and the phone number
 * with a texted code. A heading and one line, as kept minimal.
 */
export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const notice = typeof query.notice === "string" ? (notices[query.notice] ?? null) : null;
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
            Welcome back
          </h1>
          <p className="text-sm text-muted">Sign in to see your orders and wishlist.</p>
        </div>

        <GoogleOr clientId={on.googleClientId} next={next} mode="sign-in" />
        <SignInChoice next={next} notice={notice} smsOn={on.phone} />

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
