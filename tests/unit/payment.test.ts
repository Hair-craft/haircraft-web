import { describe, expect, it } from "vitest";
import {
  checkoutResult,
  deadlineText,
  failedMessage,
  minutesLeft,
  panelState,
  paymentOutcome,
} from "@/lib/checkout/payment";

const NOW = Date.parse("2026-10-07T10:00:00Z");

describe("the time left to pay", () => {
  it("counts whole minutes, never below zero", () => {
    expect(minutesLeft("2026-10-07T10:24:30Z", NOW)).toBe(24);
    expect(minutesLeft("2026-10-07T09:59:00Z", NOW)).toBe(0);
    expect(minutesLeft(null, NOW)).toBeNull();
    expect(minutesLeft("not a date", NOW)).toBeNull();
  });

  it("is said plainly", () => {
    expect(deadlineText(24)).toBe("Pay within 24 minutes or the order is cancelled.");
    expect(deadlineText(1)).toBe("Pay within 1 minute or the order is cancelled.");
    expect(deadlineText(0)).toBe("Pay within a minute or the order is cancelled.");
    expect(deadlineText(null)).toBeNull();
  });
});

describe("what the payment panel shows", () => {
  const order = (overrides: Partial<Parameters<typeof panelState>[0]> = {}) => ({
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    paymentMethod: "ONLINE",
    payment: { canPay: true },
    ...overrides,
  });

  it("offers payment for an unpaid online order", () => {
    expect(panelState(order())).toBe("payable");
  });

  it("says paid, cancelled or waiting otherwise", () => {
    expect(panelState(order({ status: "CONFIRMED", paymentStatus: "PAID" }))).toBe("paid");
    expect(panelState(order({ status: "CANCELLED", paymentStatus: "REFUNDED" }))).toBe("paid");
    expect(panelState(order({ status: "CANCELLED", payment: { canPay: false } }))).toBe(
      "cancelled",
    );
    expect(panelState(order({ payment: { canPay: false } }))).toBe("waiting");
  });

  it("isn't shown for cash on delivery", () => {
    expect(panelState(order({ paymentMethod: "COD", status: "CONFIRMED" }))).toBe("none");
  });
});

describe("the API's answers", () => {
  it("tells a declined payment from one the bank is still confirming", () => {
    expect(
      paymentOutcome(409, "PAYMENT_NOT_COMPLETED", "Your bank declined the payment.", {
        reason: "payment_declined",
      }),
    ).toEqual({ kind: "failed", message: "Your bank declined the payment." });
    expect(
      paymentOutcome(409, "PAYMENT_NOT_COMPLETED", "Your bank has not confirmed…", {
        reason: "pending",
      }).kind,
    ).toBe("pending");
  });

  it("explains an order that can't be paid and a payment service that's down", () => {
    expect(paymentOutcome(422, "ORDER_NOT_PAYABLE", "…").kind).toBe("changed");
    expect(paymentOutcome(503, "PAYMENTS_UNAVAILABLE", "…")).toMatchObject({
      kind: "unavailable",
      message: expect.stringContaining("Nothing has been charged"),
    });
    expect(paymentOutcome(0, "NETWORK_ERROR", "…").kind).toBe("unavailable");
  });

  it("treats an unconfirmed signature as pending (the webhook settles it)", () => {
    expect(paymentOutcome(400, "PAYMENT_VERIFICATION_FAILED", "…").kind).toBe("pending");
  });
});

describe("Razorpay's window", () => {
  it("passes on only a well-formed success result", () => {
    const good = {
      razorpay_order_id: "order_Abc123456",
      razorpay_payment_id: "pay_Def456789",
      razorpay_signature: "a".repeat(64),
    };
    expect(checkoutResult(good)).toEqual({
      razorpayOrderId: "order_Abc123456",
      razorpayPaymentId: "pay_Def456789",
      razorpaySignature: "a".repeat(64),
    });
    expect(checkoutResult({ ...good, razorpay_signature: "<script>" })).toBeNull();
    expect(checkoutResult(null)).toBeNull();
    expect(checkoutResult("order_Abc123456")).toBeNull();
  });

  it("shows its failure description, or a plain fallback", () => {
    expect(failedMessage("Payment failed because the bank declined it")).toBe(
      "Payment failed because the bank declined it",
    );
    expect(failedMessage(undefined)).toMatch(/Nothing has been charged/);
  });
});
