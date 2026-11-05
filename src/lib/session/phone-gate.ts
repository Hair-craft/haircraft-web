import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeWho, phoneNeeded, WHO_COOKIE } from "./cookies";
import { addPhoneHref, smsCodesOn } from "./start";

/**
 * Every account needs a mobile number (owner, 2026-11-04): a signed-in
 * customer without one (or with an unverified one while SMS codes are on)
 * goes to the "add your phone" step first, then back to \`back\`.
 */
export async function requirePhone(back: string): Promise<void> {
  const who = decodeWho((await cookies()).get(WHO_COOKIE)?.value);
  if (who && phoneNeeded(who, await smsCodesOn())) redirect(addPhoneHref(back));
}
