/**
 * Session cookies for the backend-for-frontend (BFF): the API's access and
 * refresh tokens are kept in httpOnly cookies set by this server, so
 * browser JavaScript can never read them (an XSS bug can't steal a session).
 * Sign-in itself arrives in phase S6.
 */

export const ACCESS_COOKIE = "hc_at";
export const REFRESH_COOKIE = "hc_rt";

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

/**
 * httpOnly always; Secure in production (HTTPS only); SameSite=Lax so the
 * cookies go with normal navigation but not with cross-site form posts.
 */
export function sessionCookieOptions(maxAgeSeconds: number, production: boolean): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, Math.floor(maxAgeSeconds)),
  };
}
