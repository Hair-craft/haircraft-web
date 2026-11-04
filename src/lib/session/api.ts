import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { TokenPair } from "./cookies";

/**
 * Who the shopper is, as the API should see it: their address and browser,
 * forwarded from the request this server received. The API records them on
 * the session ("your devices") and, once it trusts this server (S16), limits
 * sign-in attempts per shopper rather than per storefront.
 */
export interface ShopperClient {
  ip: string | null;
  userAgent: string | null;
}

export function clientHeaders(client: ShopperClient): Record<string, string> {
  return {
    ...(client.ip ? { "X-Forwarded-For": client.ip } : {}),
    ...(client.userAgent ? { "User-Agent": client.userAgent.slice(0, 512) } : {}),
  };
}

/**
 * The shopper's address from the incoming request's headers: the **last**
 * X-Forwarded-For entry, the one our own proxy (nginx's
 * `$proxy_add_x_forwarded_for`, or the host) added. Earlier entries come
 * from the visitor and can be made up, which would let them dodge the
 * API's per-address limits (sign-in attempts, SMS codes).
 */
export function clientFrom(headers: Headers): ShopperClient {
  const forwarded = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return {
    ip: forwarded || headers.get("x-real-ip") || null,
    userAgent: headers.get("user-agent"),
  };
}

export function signInRequest(
  email: string,
  password: string,
  client: ShopperClient,
): Promise<TokenPair> {
  return apiFetch<TokenPair>("/auth/login", {
    method: "POST",
    body: { email, password },
    headers: clientHeaders(client),
  });
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

export function registerRequest(input: RegisterInput, client: ShopperClient): Promise<TokenPair> {
  return apiFetch<TokenPair>("/auth/register", {
    method: "POST",
    body: input,
    headers: clientHeaders(client),
  });
}

export function refreshRequest(refreshToken: string, client: ShopperClient): Promise<TokenPair> {
  return apiFetch<TokenPair>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    headers: clientHeaders(client),
  });
}

/** Ends this session on the API (always succeeds there, even for an unknown token). */
export function signOutRequest(refreshToken: string): Promise<unknown> {
  return apiFetch("/auth/logout", { method: "POST", body: { refreshToken } });
}

/** Ends every session of the account, on every device. */
export function signOutEverywhereRequest(accessToken: string): Promise<unknown> {
  return apiFetch("/auth/logout-all", { method: "POST", token: accessToken });
}

export interface Profile {
  id: string;
  /** null for a customer who signed up with a phone number and gave no email. */
  email: string | null;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  /** Set when the phone was proved with an SMS code: it can then sign in. */
  phoneVerifiedAt: string | null;
  /** false: signs in by phone code or Google only (no password to change). */
  hasPassword: boolean;
}

/** The signed-in customer (an `ApiError` 401 when the session has ended). */
export function getProfile(accessToken: string): Promise<Profile> {
  return apiFetch<Profile>("/profile", { token: accessToken });
}

// ── Phone codes and Google (owner, 2026-11-04) ──────────────────────────

/** Which ways to sign in the API has switched on. */
export interface SignInMethods {
  password: boolean;
  phone: boolean;
  /** For Google's button; null when Google sign-in isn't set up. */
  googleClientId: string | null;
}

/** Cached for a minute: it only changes when the API's settings do. */
export function getSignInMethods(): Promise<SignInMethods> {
  return apiFetch<SignInMethods>("/auth/methods", { revalidate: 60 });
}

export interface CodeSent {
  resendInSeconds: number;
  expiresInSeconds: number;
  /** Development only (the API's console SMS driver sends no SMS): the code, to show on the page. */
  devCode?: string;
}

export function sendSignInCodeRequest(phone: string, client: ShopperClient): Promise<CodeSent> {
  return apiFetch<CodeSent>("/auth/otp/send", {
    method: "POST",
    body: { phone },
    headers: clientHeaders(client),
  });
}

export interface PhoneSignInResult {
  needsProfile: boolean;
  session: TokenPair | null;
  signupToken: string | null;
  signupExpiresInSeconds: number | null;
}

export function verifySignInCodeRequest(
  phone: string,
  code: string,
  client: ShopperClient,
): Promise<PhoneSignInResult> {
  return apiFetch<PhoneSignInResult>("/auth/otp/verify", {
    method: "POST",
    body: { phone, code },
    headers: clientHeaders(client),
  });
}

export function completePhoneSignupRequest(
  input: { signupToken: string; firstName: string; lastName?: string; email?: string },
  client: ShopperClient,
): Promise<TokenPair> {
  return apiFetch<TokenPair>("/auth/otp/complete", {
    method: "POST",
    body: input,
    headers: clientHeaders(client),
  });
}

export function googleSignInRequest(idToken: string, client: ShopperClient): Promise<TokenPair> {
  return apiFetch<TokenPair>("/auth/google", {
    method: "POST",
    body: { idToken },
    headers: clientHeaders(client),
  });
}

/** How the signed-in customer can sign in. */
export interface MySignInMethods {
  password: boolean;
  email: string | null;
  /** The verified phone, or null. */
  phone: string | null;
  /** The linked Google account's email, or null. */
  google: string | null;
}

export function getMySignInMethods(accessToken: string): Promise<MySignInMethods> {
  return apiFetch<MySignInMethods>("/profile/sign-in-methods", { token: accessToken });
}

export function sendPhoneChangeCodeRequest(
  accessToken: string,
  phone: string,
  client: ShopperClient,
): Promise<CodeSent> {
  return apiFetch<CodeSent>("/profile/phone/send", {
    method: "POST",
    token: accessToken,
    body: { phone },
    headers: clientHeaders(client),
  });
}

export function verifyPhoneChangeRequest(
  accessToken: string,
  phone: string,
  code: string,
): Promise<Profile> {
  return apiFetch<Profile>("/profile/phone/verify", {
    method: "POST",
    token: accessToken,
    body: { phone, code },
  });
}
