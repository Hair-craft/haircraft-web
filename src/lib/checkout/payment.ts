/**
 * Online payment rules that need no server or browser, so they are
 * unit-tested: what the payment panel shows and the API's answers in the
 * shop's words.
 */

/** Whole minutes left to pay (never negative); null when there is no deadline. */
export function minutesLeft(expiresAt: string | null, now: number): number | null {
  if (!expiresAt) return null;
  const ms = Date.parse(expiresAt) - now;
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / 60_000));
}

/** "Pay within 24 minutes or the order is cancelled." */
export function deadlineText(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes < 1) return "Pay within a minute or the order is cancelled.";
  return `Pay within ${minutes} ${minutes === 1 ? "minute" : "minutes"} or the order is cancelled.`;
}

/** What the payment panel shows for an order. */
export type PanelState = "paid" | "payable" | "cancelled" | "waiting" | "none";

export function panelState(order: {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  payment: { canPay: boolean };
}): PanelState {
  if (order.paymentMethod !== "ONLINE") return "none";
  if (
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "REFUNDED" ||
    order.paymentStatus === "PARTIALLY_REFUNDED"
  )
    return "paid";
  if (order.status === "CANCELLED") return "cancelled";
  if (order.payment.canPay) return "payable";
  // Unpaid but can't start now (e.g. the last 90 seconds, or payments switched off).
  return "waiting";
}

/** The outcome of starting or verifying a payment, for the panel. */
export type PaymentOutcome =
  | { kind: "failed"; message: string }
  | { kind: "pending"; message: string }
  | { kind: "changed"; message: string }
  | { kind: "unavailable"; message: string };

const UNAVAILABLE =
  "Online payment isn't available at the moment. Nothing has been charged. Please try again in a minute.";

/** The API's refusal (start or verify) as the panel's outcome. */
export function paymentOutcome(
  status: number,
  code: string,
  message: string,
  data: unknown = null,
): PaymentOutcome {
  switch (code) {
    case "PAYMENT_NOT_COMPLETED": {
      // The API's message is written for customers ("Your bank declined…").
      const reason = (data as { reason?: unknown } | null)?.reason;
      return reason === "pending" ? { kind: "pending", message } : { kind: "failed", message };
    }
    case "PAYMENT_VERIFICATION_FAILED":
      return {
        kind: "pending",
        message:
          "We couldn't confirm this payment yet. If money left your account, the order is confirmed automatically within a few minutes.",
      };
    case "ORDER_NOT_PAYABLE":
      return {
        kind: "changed",
        message: "This order can't be paid now. The page shows its latest state.",
      };
    case "PAYMENTS_UNAVAILABLE":
      return { kind: "unavailable", message: UNAVAILABLE };
  }
  if (status === 0 || status >= 500) return { kind: "unavailable", message: UNAVAILABLE };
  return { kind: "failed", message: "That didn't work. Please try again." };
}

/** Razorpay's own "payment.failed" description, or a plain fallback. */
export function failedMessage(description: unknown): string {
  return typeof description === "string" && description.trim()
    ? description.trim().slice(0, 300)
    : "The payment didn't go through. Nothing has been charged. Please try again or use another method.";
}

/** Razorpay Checkout's success result, checked before it's sent on. */
export function checkoutResult(
  raw: unknown,
): { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const ok = (value: unknown, pattern: RegExp) => typeof value === "string" && pattern.test(value);
  if (
    !ok(r.razorpay_order_id, /^order_[A-Za-z0-9]{6,40}$/) ||
    !ok(r.razorpay_payment_id, /^pay_[A-Za-z0-9]{6,40}$/) ||
    !ok(r.razorpay_signature, /^[a-f0-9]{64}$/)
  )
    return null;
  return {
    razorpayOrderId: r.razorpay_order_id as string,
    razorpayPaymentId: r.razorpay_payment_id as string,
    razorpaySignature: r.razorpay_signature as string,
  };
}
