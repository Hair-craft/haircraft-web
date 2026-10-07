import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/account-forms";
import { AccountCard, AccountHeading } from "@/components/account/account-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { loadForAccount } from "@/lib/account/server";
import { getProfile } from "@/lib/session/api";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

/** `/account/profile`: name and mobile. */
export default async function ProfilePage() {
  const profile = await loadForAccount("/account/profile", getProfile);
  if (!profile) return <ApiUnavailable retryHref="/account/profile" />;
  return (
    <>
      <AccountHeading
        title="Profile"
        lead="The name we greet you by, and how couriers reach you."
      />
      <AccountCard>
        <ProfileForm profile={profile} />
      </AccountCard>
    </>
  );
}
