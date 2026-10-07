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

/** The shopper's address from the incoming request's headers (first in X-Forwarded-For). */
export function clientFrom(headers: Headers): ShopperClient {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
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
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
}

/** The signed-in customer (an `ApiError` 401 when the session has ended). */
export function getProfile(accessToken: string): Promise<Profile> {
  return apiFetch<Profile>("/profile", { token: accessToken });
}
