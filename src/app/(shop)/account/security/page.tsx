import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/account/account-forms";
import { AccountCard, AccountHeading } from "@/components/account/account-parts";
import { Button } from "@/components/ui/button";
import { signOutEverywhereAction } from "@/lib/session/actions";
import { getSession } from "@/lib/session/session";

export const metadata: Metadata = {
  title: "Password and security",
  robots: { index: false, follow: false },
};

/** `/account/security`: change password, and sign out on every device. */
export default async function SecurityPage() {
  const { accessToken } = await getSession();
  if (!accessToken) redirect("/sign-in?next=/account/security");
  return (
    <>
      <AccountHeading title="Password and security" />
      <div className="flex flex-col gap-6">
        <AccountCard>
          <h2 className="font-display text-2xl">Change password</h2>
          <p className="mt-1 mb-6 text-sm text-deep/70">
            You stay signed in here; any other phone or computer is signed out.
          </p>
          <PasswordForm />
        </AccountCard>
        <AccountCard>
          <h2 className="font-display text-2xl">Sign out on all devices</h2>
          <p className="mt-1 mb-6 text-sm text-deep/70">
            Signed in on a shared or lost device? This signs you out everywhere, here too.
          </p>
          <form action={signOutEverywhereAction}>
            <Button type="submit" variant="secondary">
              Sign out on all devices
            </Button>
          </form>
        </AccountCard>
      </div>
    </>
  );
}
