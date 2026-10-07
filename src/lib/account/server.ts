import "server-only";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/session/session";

/**
 * Loads an account page's data with the customer's token. Guests go to sign
 * in (proxy.ts usually already sent them); a session the API no longer
 * accepts ends and comes back to `here` after signing in. Returns null when
 * the API can't be reached (the page shows "We'll be right back").
 */
export async function loadForAccount<T>(
  here: string,
  load: (token: string) => Promise<T>,
): Promise<T | null> {
  const { accessToken } = await getSession();
  if (!accessToken) redirect(`/sign-in?next=${encodeURIComponent(here)}`);
  try {
    return await load(accessToken);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED")
      redirect(`/bff/session/end?next=${encodeURIComponent(here)}`);
    return null;
  }
}
