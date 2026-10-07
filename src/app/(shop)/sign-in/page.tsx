import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/lib/session/rules";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

const notices: Record<string, string> = {
  ended: "Your session has ended. Please sign in again.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const notice = typeof query.notice === "string" ? (notices[query.notice] ?? null) : null;
  return (
    <AuthCard
      eyebrow="Your account"
      title="Welcome back"
      intro="Sign in to see your orders, wishlist and saved addresses."
      footer={
        <>
          New to HairCraft?{" "}
          <Link
            href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-deep underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm next={next} notice={notice} />
    </AuthCard>
  );
}
