import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/account/account-forms";
import { AccountCard, AccountHeading } from "@/components/account/account-parts";
import { PhoneVerify } from "@/components/account/phone-verify";
import { ApiUnavailable } from "@/components/api-unavailable";
import { localMobile } from "@/lib/account/rules";
import { loadForAccount } from "@/lib/account/server";
import { getMySignInMethods, getProfile, getSignInMethods } from "@/lib/session/api";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

/**
 * `/account/profile`: name and mobile, the number used to sign in (verified
 * with a code), and the ways this account can sign in (owner, 2026-11-04).
 */
export default async function ProfilePage() {
  const data = await loadForAccount("/account/profile", (token) =>
    Promise.all([
      getProfile(token),
      getMySignInMethods(token),
      getSignInMethods().catch(() => null),
    ]),
  );
  if (!data) return <ApiUnavailable retryHref="/account/profile" />;
  const [profile, mine, shop] = data;
  const verifiedPhone = profile.phoneVerifiedAt ? profile.phone : null;

  const ways = [
    {
      label: "Email and password",
      value: mine.password ? (mine.email ?? "Set") : "Not set up",
      on: mine.password,
    },
    {
      label: "Phone number",
      value: mine.phone ? `+91 ${localMobile(mine.phone)}` : "Not set up",
      on: Boolean(mine.phone),
    },
    { label: "Google", value: mine.google ?? "Not linked", on: Boolean(mine.google) },
  ];

  return (
    <>
      <AccountHeading
        title="Profile"
        lead="The name we greet you by, and how couriers reach you."
      />
      <div className="flex flex-col gap-6">
        <AccountCard>
          <ProfileForm profile={profile} />
        </AccountCard>

        {shop?.phone ? (
          <AccountCard>
            <h2 className="font-display text-2xl">Sign-in phone number</h2>
            <div className="mt-4">
              <PhoneVerify verifiedPhone={verifiedPhone} typedPhone={profile.phone} />
            </div>
          </AccountCard>
        ) : null}

        <AccountCard>
          <h2 className="font-display text-2xl">Ways you can sign in</h2>
          <ul className="mt-4 divide-y divide-line">
            {ways.map((way) => (
              <li key={way.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="font-medium text-deep">{way.label}</span>
                <span className={way.on ? "text-sage-ink" : "text-muted"}>
                  <span aria-hidden>{way.on ? "✓ " : ""}</span>
                  {way.value}
                </span>
              </li>
            ))}
          </ul>
          {!mine.google && shop?.googleClientId ? (
            <p className="mt-3 text-xs text-muted">
              To link Google, sign out and choose &ldquo;Continue with Google&rdquo; with a Google
              account that uses the same email.
            </p>
          ) : null}
          {mine.password ? (
            <p className="mt-3 text-xs text-muted">
              <Link
                href="/account/security"
                className="underline underline-offset-4 hover:text-deep"
              >
                Change your password
              </Link>
            </p>
          ) : null}
        </AccountCard>
      </div>
    </>
  );
}
