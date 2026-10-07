/**
 * Session cookies for the backend-for-frontend (BFF): the API's access and
 * refresh tokens are kept in httpOnly cookies set by this server, so
 * browser JavaScript can never read them (an XSS bug can't steal a session).
 * Pure (no server-only imports), so `proxy.ts`, server actions and unit tests
 * share the same names and rules.
 */
import { accessCookieSeconds, refreshCookieSeconds } from "./rules";

export const ACCESS_COOKIE = "hc_at";
export const REFRESH_COOKIE = "hc_rt";
/** First name and email for the header. Display only: never trusted for access. */
export const WHO_COOKIE = "hc_who";
/** A one-time note for the next page ("signed-out"), readable by the page's script. */
export const FLASH_COOKIE = "hc_flash";

export interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

/**
 * httpOnly (unless said otherwise); Secure in production (HTTPS only);
 * SameSite=Lax so the cookies go with normal navigation but not with
 * cross-site form posts.
 */
export function sessionCookieOptions(
  maxAgeSeconds: number,
  production: boolean,
  httpOnly = true,
): SessionCookieOptions {
  return {
    httpOnly,
    secure: production,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, Math.floor(maxAgeSeconds)),
  };
}

export interface Who {
  firstName: string;
  email: string;
}

/** The display cookie's value: base64url JSON (cookie-safe). */
export function encodeWho(who: Who): string {
  return Buffer.from(JSON.stringify({ f: who.firstName, e: who.email })).toString("base64url");
}

export function decodeWho(value: string | undefined): Who | null {
  if (!value) return null;
  try {
    const data = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      f?: unknown;
      e?: unknown;
    };
    if (typeof data.f !== "string" || typeof data.e !== "string") return null;
    return { firstName: data.f.slice(0, 100), email: data.e.slice(0, 254) };
  } catch {
    return null;
  }
}

/** What the API returns on sign-in, registration and refresh. */
export interface TokenPair {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: { id: string; email: string; firstName: string; lastName: string | null };
}

export interface CookieToSet {
  name: string;
  value: string;
  options: SessionCookieOptions;
}

/** The three session cookies for a token pair. */
export function sessionCookies(tokens: TokenPair, production: boolean, now: number): CookieToSet[] {
  const refreshSeconds = refreshCookieSeconds(tokens.refreshTokenExpiresAt, now);
  return [
    {
      name: ACCESS_COOKIE,
      value: tokens.accessToken,
      options: sessionCookieOptions(accessCookieSeconds(tokens.accessTokenExpiresIn), production),
    },
    {
      name: REFRESH_COOKIE,
      value: tokens.refreshToken,
      options: sessionCookieOptions(refreshSeconds, production),
    },
    {
      name: WHO_COOKIE,
      value: encodeWho({ firstName: tokens.user.firstName, email: tokens.user.email }),
      options: sessionCookieOptions(refreshSeconds, production),
    },
  ];
}

/** Expired copies of the session cookies, which make the browser delete them. */
export function clearedSessionCookies(production: boolean): CookieToSet[] {
  return [ACCESS_COOKIE, REFRESH_COOKIE, WHO_COOKIE].map((name) => ({
    name,
    value: "",
    options: sessionCookieOptions(0, production),
  }));
}

/** A one-time note for the next page (not httpOnly: the page's script reads and removes it). */
export function flashCookie(note: string, production: boolean): CookieToSet {
  return { name: FLASH_COOKIE, value: note, options: sessionCookieOptions(60, production, false) };
}
