import { NextResponse, type NextRequest } from "next/server";
import { clearedSessionCookies } from "@/lib/session/cookies";
import { safeNext } from "@/lib/session/rules";

/**
 * GET /bff/session/end?next=…: a page found that the API no longer accepts
 * this session (signed out everywhere, password changed…). Pages can't
 * remove cookies, so they send the shopper here: the session cookies are
 * removed and the shopper is asked to sign in again.
 */
export function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("notice", "ended");
  if (next) signIn.searchParams.set("next", next);
  const response = NextResponse.redirect(signIn);
  for (const cookie of clearedSessionCookies(process.env.NODE_ENV === "production"))
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
