import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, decodeWho, WHO_COOKIE } from "./cookies";

export interface SessionUser {
  firstName: string;
  email: string;
}

export interface Session {
  user: SessionUser | null;
  /** The access token for API calls on the customer's behalf (server only). */
  accessToken: string | null;
}

/**
 * The current visitor's session, read from the httpOnly cookies (`proxy.ts`
 * has already refreshed them if needed). Reading cookies makes the page
 * personal (rendered per request).
 *
 * The access token is checked by the API whenever it is used; a page that
 * uses it and gets "session ended" sends the shopper to sign in again.
 */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value || null;
  if (!accessToken) return { user: null, accessToken: null };
  const who = decodeWho(store.get(WHO_COOKIE)?.value);
  return { user: who ?? { firstName: "", email: "" }, accessToken };
}
