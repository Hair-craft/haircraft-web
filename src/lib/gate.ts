/**
 * The coming-soon gate: while the shop is closed (STORE_OPEN=false, the
 * production default until launch), every page shows the coming-soon page
 * at its own URL. Pure function, used by `proxy.ts` and unit tests.
 */

export const COMING_SOON_PATH = "/coming-soon";

/** Files every site needs, served the same whether the shop is open or not. */
const ALWAYS_SERVED = [/^\/robots\.txt$/, /^\/sitemap\.xml$/, /^\/(icon|apple-icon)(\.\w+)?$/, /^\/favicon\.ico$/];

export type GateDecision =
  | { action: "next" }
  | { action: "rewrite"; to: string }
  | { action: "redirect"; to: string };

export function gateDecision(pathname: string, storeOpen: boolean): GateDecision {
  if (ALWAYS_SERVED.some((pattern) => pattern.test(pathname))) return { action: "next" };
  if (storeOpen) {
    // Old links to the coming-soon page go to the shop once it is open.
    return pathname === COMING_SOON_PATH ? { action: "redirect", to: "/" } : { action: "next" };
  }
  return pathname === COMING_SOON_PATH ? { action: "next" } : { action: "rewrite", to: COMING_SOON_PATH };
}
