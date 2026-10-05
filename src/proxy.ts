import { NextResponse, type NextRequest } from "next/server";
import { settings } from "@/lib/env";
import { gateDecision } from "@/lib/gate";

/**
 * Runs before every page request (not for static files and images, see
 * `matcher`). Today it only applies the coming-soon gate.
 */
export function proxy(request: NextRequest) {
  const decision = gateDecision(request.nextUrl.pathname, settings().storeOpen);
  if (decision.action === "rewrite") {
    return NextResponse.rewrite(new URL(decision.to, request.url));
  }
  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url), 308);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next.js internals and files from /public (images, logo…).
  matcher: ["/((?!_next/static|_next/image|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|txt|xml)$).*)"],
};
