"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rememberEmptyBag } from "@/lib/cart/server";
import { ACCESS_COOKIE, clearedSessionCookies } from "@/lib/session/cookies";
import { placeOrder } from "./api";
import {
  checkoutHref,
  couponCode,
  isIdempotencyKey,
  noticeForOrderError,
  type CheckoutState,
} from "./rules";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONEY = /^\d{1,10}\.\d{2}$/;

/**
 * Place order. A plain form (it works without JavaScript); whatever goes
 * wrong comes back to checkout with a notice code, the page then showing the
 * fresh totals. The idempotency key was made when the page was drawn, so a
 * double click or a resent form returns the same order.
 */
export async function placeOrderAction(form: FormData): Promise<void> {
  const text = (name: string, max: number) => String(form.get(name) ?? "").slice(0, max);
  const state: CheckoutState = {
    address: UUID.test(text("address", 40)) ? text("address", 40).toLowerCase() : null,
    coupon: couponCode(text("coupon", 40)),
    pay: text("pay", 10) === "COD" ? "COD" : "ONLINE",
  };
  const key = text("key", 100);
  const expected = text("expectedGrandTotal", 20);
  const notes = text("notes", 500).trim() || null;
  if (!state.address) redirect(checkoutHref(state, "address"));
  if (!isIdempotencyKey(key) || !MONEY.test(expected)) redirect(checkoutHref(state, "failed"));

  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) redirect(`/sign-in?next=${encodeURIComponent(checkoutHref(state))}`);

  let orderNumber: string;
  try {
    const order = await placeOrder(token, key, {
      addressId: state.address,
      couponCode: state.coupon,
      paymentMethod: state.pay,
      notes,
      expectedGrandTotal: expected,
    });
    orderNumber = order.orderNumber;
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED") {
      const production = process.env.NODE_ENV === "production";
      for (const cookie of clearedSessionCookies(production))
        store.set(cookie.name, cookie.value, cookie.options);
      redirect(`/sign-in?notice=ended&next=${encodeURIComponent(checkoutHref(state))}`);
    }
    const outcome = noticeForOrderError(error.status, error.code);
    redirect(
      checkoutHref(
        {
          ...state,
          coupon: outcome.dropCoupon ? null : state.coupon,
          pay: outcome.payOnline ? "ONLINE" : state.pay,
        },
        outcome.notice,
      ),
    );
  }
  // The API emptied the bag with the order.
  await rememberEmptyBag();
  // Pay online: the payment window opens straight away on the order's page.
  redirect(
    `/checkout/placed/${encodeURIComponent(orderNumber)}${state.pay === "ONLINE" ? "?pay=1" : ""}`,
  );
}
