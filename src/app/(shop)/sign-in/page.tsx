import type { Metadata } from "next";
import { GoogleOr } from "@/components/auth/google-or";
import { SignInForm } from "@/components/auth/auth-forms";
import { CodeSignIn } from "@/components/auth/code-sign-in";
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
    return { password: true, phone: false, email: false, googleClientId: null };
  }
}

/**
 * `/sign-in` (owner, 2026-11-06, like Gemeria's): "Continue with Google", then
 * one box for an email or a mobile number and a 6-digit code sent there
 * ("Use a password instead" for the password). Without email or SMS codes,
 * the password form alone. A heading and one line, as kept minimal.
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
            Sign in
          </h1>
          <p className="text-sm text-muted">
            New or returning, sign in with a code to shop and see your orders.
          </p>
        </div>

        <GoogleOr clientId={on.googleClientId} next={next} mode="sign-in" />
        {on.email || on.phone ? (
          <CodeSignIn next={next} notice={notice} emailOn={Boolean(on.email)} smsOn={on.phone} />
        ) : (
          <SignInForm next={next} notice={notice} />
        )}
      </div>
    </div>
  );
}
