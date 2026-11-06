import { redirect } from "next/navigation";
import { safeNext } from "@/lib/session/rules";

/**
 * `/register`: there is no separate account form any more (owner, 2026-11-06:
 * "we do not need to create account, we just login"). A code at sign-in
 * makes the account; old links land there.
 */
export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  redirect(`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}
