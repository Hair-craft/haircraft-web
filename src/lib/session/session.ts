import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "./cookies";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
}

export interface Session {
  user: SessionUser | null;
  /** The access token for API calls on the customer's behalf (server only). */
  accessToken: string | null;
}

/**
 * The current visitor's session, read from the httpOnly cookies. Reading
 * cookies makes the page personal (rendered per request), which every shop
 * page is once the header shows the account and cart.
 *
 * Until sign-in exists (phase S6) everyone is a guest: a session cookie is
 * not trusted before S6 checks it with the API and refreshes it.
 */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  void store.has(ACCESS_COOKIE);
  return { user: null, accessToken: null };
}
