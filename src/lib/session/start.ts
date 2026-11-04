import "server-only";
import { cookies } from "next/headers";
import { mergeGuestCartInto } from "@/lib/cart/server";
import { wishlistAfterSignIn } from "@/lib/wishlist/server";
import { flashCookie, sessionCookies, type CookieToSet, type TokenPair } from "./cookies";

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
