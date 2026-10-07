import { NextResponse, type NextRequest } from "next/server";
import { settings } from "@/lib/env";
import { gateDecision } from "@/lib/gate";
import { clientFrom } from "@/lib/session/api";
import {
  ACCESS_COOKIE,
  clearedSessionCookies,
  REFRESH_COOKIE,
  sessionCookies,
  type CookieToSet,
} from "@/lib/session/cookies";
import { refreshSession } from "@/lib/session/refresh";
import { DEFAULT_AFTER_SIGN_IN, safeNext } from "@/lib/session/rules";

const needsSession = (path: string) =>
  path === "/account" ||
  path.startsWith("/account/") ||
  path === "/wishlist" ||
  path === "/checkout" ||
  path.startsWith("/checkout/");
const isSignInPage = (path: string) => path === "/sign-in" || path === "/register";

/**
 * Runs before every page request (not for static files and images, see
 * `matcher`):
 *
 * 1. the coming-soon gate
 * 2. the session: when the access-token cookie has run out but the refresh
 *    token is there, refresh once (shared by requests arriving together),
 *    and hand the new cookies both to this request's page and to the browser
 * 3. account pages need a session; the sign-in pages don't make sense with one
 */
export async function proxy(request: NextRequest) {
  const decision = gateDecision(request.nextUrl.pathname, settings().storeOpen);
  if (decision.action === "rewrite") {
    return NextResponse.rewrite(new URL(decision.to, request.url));
  }
  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url), 308);
  }

  const production = process.env.NODE_ENV === "production";
  const toBrowser: CookieToSet[] = [];
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!request.cookies.get(ACCESS_COOKIE)?.value && refreshToken) {
    const outcome = await refreshSession(refreshToken, clientFrom(request.headers));
    if (outcome.kind === "ok") {
      const fresh = sessionCookies(outcome.tokens, production, Date.now());
      for (const cookie of fresh) request.cookies.set(cookie.name, cookie.value);
      toBrowser.push(...fresh);
    } else if (outcome.kind === "ended") {
      const cleared = clearedSessionCookies(production);
      for (const cookie of cleared) request.cookies.delete(cookie.name);
      toBrowser.push(...cleared);
    }
    // "keep" and "unavailable": this request continues as a guest; cookies are left alone.
  }

  const path = request.nextUrl.pathname;
  const signedIn = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);
  let response: NextResponse;
  if (needsSession(path) && !signedIn) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", `${path}${request.nextUrl.search}`);
    response = NextResponse.redirect(signIn);
  } else if (isSignInPage(path) && signedIn) {
    const next = safeNext(request.nextUrl.searchParams.get("next")) ?? DEFAULT_AFTER_SIGN_IN;
    response = NextResponse.redirect(new URL(next, request.url));
  } else {
    // The page sees the refreshed (or removed) cookies through the request headers.
    response = NextResponse.next({ request: { headers: request.headers } });
  }
  for (const cookie of toBrowser) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

export const config = {
  // Everything except Next.js internals and files from /public (images, logo…).
  matcher: [
    "/((?!_next/static|_next/image|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|txt|xml)$).*)",
  ],
};
