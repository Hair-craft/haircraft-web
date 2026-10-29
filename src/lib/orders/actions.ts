"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { previewCart } from "@/lib/cart/api";
import { replaceBag } from "@/lib/cart/server";
import { ACCESS_COOKIE, clearedSessionCookies, flashCookie } from "@/lib/session/cookies";
import { cancelOrder, getOrderDetail } from "./api";
import { cancelReason } from "./rules";

export interface CancelState {
  error: string | null;
  /** What was chosen and typed, to fill the form in again after a problem. */
  reason?: string;
  details?: string;
}

const ORDER_NUMBER = /^HC-\d{4,10}$/i;
const production = () => process.env.NODE_ENV === "production";

/** Ends this browser's session and asks the shopper to sign in again, coming back to `next`. */
async function endSession(next: string): Promise<never> {
  const store = await cookies();
  for (const cookie of clearedSessionCookies(production()))
    store.set(cookie.name, cookie.value, cookie.options);
  redirect(`/sign-in?notice=ended&next=${encodeURIComponent(next)}`);
}

/** Cancel my order, with a reason. A plain form, so it works without JavaScript too. */
export async function cancelOrderAction(
  _previous: CancelState,
  form: FormData,
): Promise<CancelState> {
  const orderNumber = String(form.get("orderNumber") ?? "").toUpperCase();
  if (!ORDER_NUMBER.test(orderNumber)) return { error: "That order wasn't found." };
  const here = `/account/orders/${orderNumber}`;
  const chosen = {
    reason: String(form.get("reason") ?? "").slice(0, 100),
    details: String(form.get("details") ?? "").slice(0, 600),
  };
  const checked = cancelReason(chosen.reason, chosen.details);
  if ("problem" in checked) return { error: checked.problem, ...chosen };
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return endSession(here);
  try {
    await cancelOrder(token, orderNumber, checked.reason);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED") return endSession(here);
    if (error.status === 0 || error.status >= 500)
      return {
        error: "We can't reach the shop at the moment. Please try again in a minute.",
        ...chosen,
      };
    // Typically: the shop has started preparing it meanwhile.
    return {
      error:
        "This order can't be cancelled any more: the shop has started preparing it. Please contact us if you need help.",
    };
  }
  const note = flashCookie("order-cancelled", production());
  (await cookies()).set(note.name, note.value, note.options);
  redirect(here);
}

/**
 * Buy again: the bag becomes exactly this order's items that can still be
 * bought (same options and quantities: deleted, hidden and sold-out ones are
 * left out), and the customer goes straight to checkout, with a note when
 * some were left out. When none can be bought, the bag is left alone and the
 * order page says so.
 */
export async function buyAgainAction(form: FormData): Promise<void> {
  const orderNumber = String(form.get("orderNumber") ?? "").toUpperCase();
  if (!ORDER_NUMBER.test(orderNumber)) redirect("/account/orders");
  const here = `/account/orders/${orderNumber}`;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return endSession(here);
  let items: { variantId: string | null; quantity: number }[];
  try {
    items = (await getOrderDetail(token, orderNumber)).items;
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED") return endSession(here);
    redirect(here);
  }
  // A product deleted since has no variant left to buy.
  const wanted = items
    .filter((item): item is { variantId: string; quantity: number } => item.variantId !== null)
    .map((item) => ({ variantId: item.variantId, quantity: item.quantity }));
  let buyable: typeof wanted = [];
  try {
    const preview = wanted.length > 0 ? await previewCart(wanted) : null;
    buyable = wanted.filter((line) =>
      preview?.lines.some(
        (l) => l.variantId === line.variantId.toLowerCase() && l.availability === "available",
      ),
    );
  } catch (error) {
    if (!isApiError(error)) throw error;
    redirect(here);
  }
  if (buyable.length === 0) {
    const note = flashCookie("again-none", production());
    (await cookies()).set(note.name, note.value, note.options);
    redirect(here);
  }
  let skipped: number;
  try {
    skipped = await replaceBag(token, buyable);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED") return endSession(here);
    redirect(here);
  }
  const left = items.length - buyable.length + skipped;
  redirect(left > 0 ? "/checkout?notice=again-skipped" : "/checkout");
}
