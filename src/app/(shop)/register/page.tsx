import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/lib/session/rules";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  return (
    <AuthCard
      eyebrow="Join HairCraft"
      title="Create your account"
      intro="Check out faster, follow your orders and keep a wishlist."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-deep underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthCard>
  );
}
