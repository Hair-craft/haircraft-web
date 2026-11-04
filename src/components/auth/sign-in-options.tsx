import Link from "next/link";
import type { SignInMethods } from "@/lib/session/api";
import { GoogleButton } from "./google-button";
import { PhoneSignIn } from "./phone-sign-in";

function Or() {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold tracking-widest text-muted uppercase">
      <span aria-hidden className="h-px flex-1 bg-line" />
      or
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * The ways in, in the owner's order (2026-11-04): phone number first, then
 * Google, then email and password. Each shows only when the API has it on.
 */
export function SignInOptions({
  methods,
  next,
  mode,
  emailHref,
}: {
  methods: SignInMethods;
  next: string | null;
  mode: "sign-in" | "register";
  emailHref: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {methods.phone ? <PhoneSignIn next={next} mode={mode} /> : null}
      {methods.googleClientId ? (
        <>
          {methods.phone ? <Or /> : null}
          <GoogleButton clientId={methods.googleClientId} next={next} mode={mode} />
        </>
      ) : null}
      <p className="text-center text-sm">
        <Link
          href={emailHref}
          className="font-semibold text-deep underline-offset-4 transition-colors hover:text-gold-ink hover:underline"
        >
          {mode === "register" ? "Register with email and password" : "Use email and password"}
        </Link>
      </p>
    </div>
  );
}
