import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddPhoneStep, PhoneAlreadyAdded } from "@/components/auth/add-phone-step";
import { AuthCard } from "@/components/auth/auth-card";
import { isApiError } from "@/lib/api/errors";
import { localMobile } from "@/lib/account/rules";
import { signOutAction } from "@/lib/session/actions";
import { getProfile } from "@/lib/session/api";
import { phoneNeeded, phoneStatusOf } from "@/lib/session/cookies";
import { DEFAULT_AFTER_SIGN_IN, safeNext } from "@/lib/session/rules";
import { getSession } from "@/lib/session/session";
import { smsCodesOn } from "@/lib/session/start";

export const metadata: Metadata = {
  title: "Add your mobile number",
  robots: { index: false, follow: false },
};

/**
 * `/add-phone` (owner, 2026-11-04: every account needs a mobile number):
 * shown after a first Google sign-in, and at sign-in for an older account
 * without one (or with an unverified one while SMS codes are on). Then on to
 * `next`. Signing out is always possible.
 */
export default async function AddPhonePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const next =
    safeNext(typeof query.next === "string" ? query.next : null) ?? DEFAULT_AFTER_SIGN_IN;
  const { accessToken } = await getSession();
  if (!accessToken) redirect(`/sign-in?next=${encodeURIComponent(`/add-phone?next=${next}`)}`);

  let profile;
  try {
    profile = await getProfile(accessToken);
  } catch (error) {
    if (isApiError(error) && error.status === 401)
      redirect(`/sign-in?notice=ended&next=${encodeURIComponent(next)}`);
    throw error;
  }
  const smsOn = await smsCodesOn();
  const status = phoneStatusOf(profile);
  // Already done (e.g. in another tab): note it on this browser and go on.
  if (!phoneNeeded({ firstName: profile.firstName, email: profile.email, phone: status }, smsOn)) {
    return <PhoneAlreadyAdded status={status} next={next} />;
  }

  return (
    <AuthCard
      eyebrow="One last step"
      title="Add your mobile number"
      intro={
        smsOn
          ? "We'll text you a code to verify it. You can then sign in with it too."
          : "We'll use it for your orders, and you can sign in with it too."
      }
      footer={
        <form action={signOutAction}>
          <button type="submit" className="font-medium text-deep underline underline-offset-4">
            Sign out
          </button>
        </form>
      }
    >
      <AddPhoneStep smsOn={smsOn} startValue={localMobile(profile.phone)} next={next} />
    </AuthCard>
  );
}
