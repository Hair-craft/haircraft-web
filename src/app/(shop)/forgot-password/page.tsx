import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = {
  title: "Forgot your password?",
  robots: { index: false, follow: true },
};

/**
 * Until the shop can send emails (the backend's emails phase), a password
 * can't be reset online, so this page says how to get help instead.
 * PLACEHOLDER — FOR THE OWNER: the contact details come with the contact
 * page (S14).
 */
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="Your account"
      title="Forgot your password?"
      footer={
        <Link href="/sign-in" className="font-medium text-deep underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-4 text-deep/80">
        <p>
          Resetting a password online is coming soon. Until then, please contact us from the email
          address on your account, and we&apos;ll help you get back in.
        </p>
        <p>
          <Link href="/contact" className="font-medium text-deep underline underline-offset-4">
            Contact us
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
