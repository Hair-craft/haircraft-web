"use server";

import { cookies } from "next/headers";
import { isApiError } from "@/lib/api/errors";
import { ACCESS_COOKIE } from "@/lib/session/cookies";
import { startPayment, verifyPayment, type RazorpayCheckout } from "./api";
import { checkoutResult, paymentOutcome, type PaymentOutcome } from "./payment";

export type StartResult =
  | { ok: true; checkout: RazorpayCheckout }
  | { ok: false; outcome: PaymentOutcome; sessionEnded?: true };

export type VerifyResult =
  { ok: true } | { ok: false; outcome: PaymentOutcome; sessionEnded?: true };

const ORDER_NUMBER = /^HC-\d{4,10}$/i;

async function token(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value || null;
}

const SESSION_ENDED = {
  ok: false,
  sessionEnded: true,
  outcome: { kind: "changed", message: "Your session has ended. Please sign in again." },
} as const;

function failure(error: unknown): { ok: false; outcome: PaymentOutcome; sessionEnded?: true } {
  if (!isApiError(error)) throw error;
  if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED") return SESSION_ENDED;
  return {
    ok: false,
    outcome: paymentOutcome(error.status, error.code, error.message, error.data),
  };
}

/** What Razorpay's window needs for this order (reused on every try). */
export async function startPaymentAction(orderNumber: string): Promise<StartResult> {
  const accessToken = await token();
  if (!ORDER_NUMBER.test(String(orderNumber)) || !accessToken) return SESSION_ENDED;
  try {
    return { ok: true, checkout: await startPayment(accessToken, String(orderNumber)) };
  } catch (error) {
    return failure(error);
  }
}

/** Razorpay's success result, checked by the API; the order is then confirmed. */
export async function verifyPaymentAction(
  orderNumber: string,
  raw: unknown,
): Promise<VerifyResult> {
  const accessToken = await token();
  const result = checkoutResult(raw);
  if (!ORDER_NUMBER.test(String(orderNumber)) || !accessToken) return SESSION_ENDED;
  if (!result)
    return {
      ok: false,
      outcome: paymentOutcome(400, "PAYMENT_VERIFICATION_FAILED", ""),
    };
  try {
    await verifyPayment(accessToken, String(orderNumber), result);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
