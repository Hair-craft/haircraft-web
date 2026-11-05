import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";
import { business } from "@/content/business";
import { whatsappChatHref } from "@/lib/info/contact";
import { safeNext } from "@/lib/session/rules";
import { smsCodesOn } from "@/lib/session/start";

export const metadata: Metadata = {
  title: "Forgot your password?",
  robots: { index: false, follow: true },
};

/**
 * A forgotten password (owner, 2026-11-04): reset with a code texted to the
 * account's mobile number. Until the shop can send SMS, one line says how to
 * get help instead.
 */
export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const smsOn = await smsCodesOn();
  const whatsapp = whatsappChatHref(business);

  return (
    <AuthCard
      eyebrow="Your account"
      title="Forgot your password?"
      intro={smsOn ? "We'll text a code to your mobile number." : undefined}
      footer={
        <Link href="/sign-in" className="font-medium text-deep underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      {smsOn ? (
        <ForgotPasswordFlow next={next} />
      ) : (
        <p className="text-muted">
          Message us on{" "}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-deep underline underline-offset-4"
            >
              WhatsApp
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            "WhatsApp"
          )}{" "}
          or{" "}
          <a
            href={`mailto:${business.email}`}
            className="font-medium text-deep underline underline-offset-4"
          >
            email
          </a>{" "}
          from your account&apos;s number or email, and we&apos;ll help you back in.
        </p>
      )}
    </AuthCard>
  );
}
