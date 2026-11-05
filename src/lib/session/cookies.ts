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

/** The account's phone (owner, 2026-11-04: every account needs one, verified while SMS is on). */
export type PhoneStatus = "none" | "unverified" | "verified";

export interface Who {
  firstName: string;
  /** null for a customer who signed up with a phone number and gave no email. */
  email: string | null;
  /** Older cookies carry none: treated as "verified", so nobody is stopped by mistake. */
  phone?: PhoneStatus;
}

const PHONE_CODES: Record<PhoneStatus, number> = { none: 0, unverified: 1, verified: 2 };

/** The display cookie's value: base64url JSON (cookie-safe). */
export function encodeWho(who: Who): string {
  return Buffer.from(
    JSON.stringify({ f: who.firstName, e: who.email, p: PHONE_CODES[who.phone ?? "verified"] }),
  ).toString("base64url");
}

/** The phone status of an account, from the API's user. */
export function phoneStatusOf(user: {
  phone?: string | null;
  phoneVerifiedAt?: string | null;
}): PhoneStatus {
  if (!user.phone) return "none";
  return user.phoneVerifiedAt ? "verified" : "unverified";
}

/** Whether to ask for the phone before going on: none, or not verified while SMS codes are on. */
export function phoneNeeded(who: Who | null, smsOn: boolean): boolean {
  if (!who) return false;
  const status = who.phone ?? "verified";
  return status === "none" || (smsOn && status === "unverified");
}

export function decodeWho(value: string | undefined): Who | null {
  if (!value) return null;
  try {
    const data = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      f?: unknown;
      e?: unknown;
      p?: unknown;
    };
    if (typeof data.f !== "string") return null;
    if (typeof data.e !== "string" && data.e !== null && data.e !== undefined) return null;
    return {
      firstName: data.f.slice(0, 100),
      email: typeof data.e === "string" ? data.e.slice(0, 254) : null,
      phone: data.p === 0 ? "none" : data.p === 1 ? "unverified" : "verified",
    };
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
  user: {
    id: string;
    email: string | null;
    firstName: string;
    lastName: string | null;
    phone?: string | null;
    phoneVerifiedAt?: string | null;
  };
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
      value: encodeWho({
        firstName: tokens.user.firstName,
        email: tokens.user.email,
        phone: phoneStatusOf(tokens.user),
      }),
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
