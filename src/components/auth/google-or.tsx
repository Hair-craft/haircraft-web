import { GoogleButton } from "./google-button";

/**
 * "Continue with Google", then "or", above the sign-in and create-account
 * forms (owner, 2026-11-04). Nothing when Google sign-in isn't set up.
 */
export function GoogleOr({
  clientId,
  next,
  mode,
}: {
  clientId: string | null;
  next: string | null;
  mode: "sign-in" | "register";
}) {
  if (!clientId) return null;
  return (
    <div className="mb-6 flex flex-col gap-6">
      <GoogleButton clientId={clientId} next={next} mode={mode} />
      <div className="flex items-center gap-3 text-xs font-semibold tracking-widest text-muted uppercase">
        <span aria-hidden className="h-px flex-1 bg-line" />
        or
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
