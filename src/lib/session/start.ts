import "server-only";
import { cookies } from "next/headers";
import { mergeGuestCartInto } from "@/lib/cart/server";
import { wishlistAfterSignIn } from "@/lib/wishlist/server";
import { getSignInMethods } from "./api";
import {
  decodeWho,
  encodeWho,
  flashCookie,
  phoneNeeded,
  phoneStatusOf,
  sessionCookieOptions,
  sessionCookies,
  WHO_COOKIE,
  type CookieToSet,
  type PhoneStatus,
  type TokenPair,
} from "./cookies";

/**
 * Not a server action ("use server" would make it callable from browsers):
 * shared by the sign-in actions (email, phone code, Google).
 */
const production = () => process.env.NODE_ENV === "production";

export async function setCookies(list: CookieToSet[]) {
  const store = await cookies();
  for (const cookie of list) store.set(cookie.name, cookie.value, cookie.options);
}

/**
 * Signs the shopper in on this browser, and brings their guest bag along
 * (it joins the account's; a note says if anything couldn't be added), and
 * saves the product they pressed a heart on as a guest.
 */
export async function startSession(tokens: TokenPair) {
  await setCookies(sessionCookies(tokens, production(), Date.now()));
  const skipped = await mergeGuestCartInto(tokens.accessToken);
  await wishlistAfterSignIn(tokens.accessToken);
  if (skipped > 0) await setCookies([flashCookie("cart-skipped", production())]);
}

/** Whether SMS codes are on (cached for a minute); off when the API can't say. */
export async function smsCodesOn(): Promise<boolean> {
  try {
    return (await getSignInMethods()).phone;
  } catch {
    return false;
  }
}

/** The "add your phone" step, then `next` (owner, 2026-11-04: every account needs a phone). */
export function addPhoneHref(next: string): string {
  return `/add-phone?next=${encodeURIComponent(next)}`;
}

/**
 * Where to go after signing in: `next`, or first the "add your phone" step
 * when the account has no phone (or an unverified one while SMS codes are on).
 */
export async function afterSignIn(tokens: TokenPair, next: string): Promise<string> {
  const who = { firstName: "", email: null, phone: phoneStatusOf(tokens.user) };
  return phoneNeeded(who, await smsCodesOn()) ? addPhoneHref(next) : next;
}

/** Notes the account's new phone status in the display cookie (after adding the phone). */
export async function setWhoPhone(phone: PhoneStatus): Promise<void> {
  const store = await cookies();
  const who = decodeWho(store.get(WHO_COOKIE)?.value);
  if (!who) return;
  // The cookie lives as long as the session; a refresh rewrites it with the right age.
  store.set(
    WHO_COOKIE,
    encodeWho({ ...who, phone }),
    sessionCookieOptions(30 * 24 * 60 * 60, production()),
  );
}
