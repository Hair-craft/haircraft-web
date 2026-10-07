import { describe, expect, it } from "vitest";
import type { Address } from "@/lib/account/rules";
import {
  bagProblems,
  checkoutHref,
  checkoutNotice,
  chosenAddress,
  couponCode,
  idempotencyKey,
  isIdempotencyKey,
  nextSteps,
  noticeForOrderError,
  readCheckoutState,
  type CheckoutPreview,
} from "@/lib/checkout/rules";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("the checkout's address-bar state", () => {
  it("reads the choices, ignoring anything unexpected", () => {
    expect(
      readCheckoutState({ address: A.toUpperCase(), coupon: " welcome10 ", pay: "cod" }),
    ).toEqual({
      address: A,
      coupon: "WELCOME10",
      pay: "COD",
    });
    expect(readCheckoutState({ address: "not-an-id", coupon: "<script>", pay: "bitcoin" })).toEqual(
      { address: null, coupon: null, pay: "ONLINE" },
    );
    expect(readCheckoutState({ address: [A, B] }).address).toBe(A);
  });

  it("writes only what differs from the defaults, round-tripping", () => {
    expect(checkoutHref({ address: null, coupon: null, pay: "ONLINE" })).toBe("/checkout");
    const href = checkoutHref({ address: A, coupon: "SAVE5", pay: "COD" }, "price-changed");
    expect(href).toBe(`/checkout?address=${A}&coupon=SAVE5&pay=cod&notice=price-changed`);
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(readCheckoutState(params)).toEqual({ address: A, coupon: "SAVE5", pay: "COD" });
  });
});

describe("coupon codes", () => {
  it("accepts letters, digits, - and _ (up to 30), in upper case", () => {
    expect(couponCode("diwali-25")).toBe("DIWALI-25");
    expect(couponCode("")).toBeNull();
    expect(couponCode("TWO WORDS")).toBeNull();
    expect(couponCode("X".repeat(31))).toBeNull();
  });
});

describe("the delivery address", () => {
  const address = (id: string, isDefault: boolean) => ({ id, isDefault }) as Address;

  it("is the one asked for, else the default, else the first", () => {
    const list = [address(A, false), address(B, true)];
    expect(chosenAddress(list, A)?.id).toBe(A);
    expect(chosenAddress(list, null)?.id).toBe(B);
    expect(chosenAddress(list, "33333333-3333-4333-8333-333333333333")?.id).toBe(B);
    expect(chosenAddress([address(A, false)], null)?.id).toBe(A);
    expect(chosenAddress([], A)).toBeNull();
  });
});

describe("idempotency keys", () => {
  it("are in the API's format", () => {
    const key = idempotencyKey("7f3c9a2e-1b4d-4c8e-9f00-2a6b5c4d3e21");
    expect(key).toBe("checkout-7f3c9a2e-1b4d-4c8e-9f00-2a6b5c4d3e21");
    expect(isIdempotencyKey(key)).toBe(true);
    expect(isIdempotencyKey("short")).toBe(false);
    expect(isIdempotencyKey("has spaces in it")).toBe(false);
  });
});

describe("refusals when ordering", () => {
  it("come back as notices, undoing what can't be used", () => {
    expect(noticeForOrderError(409, "PRICE_CHANGED")).toEqual({ notice: "price-changed" });
    expect(noticeForOrderError(409, "CART_NOT_READY")).toEqual({ notice: "bag-changed" });
    expect(noticeForOrderError(422, "COUPON_INVALID")).toEqual({
      notice: "coupon",
      dropCoupon: true,
    });
    expect(noticeForOrderError(422, "COD_NOT_AVAILABLE")).toEqual({
      notice: "cod",
      payOnline: true,
    });
    expect(noticeForOrderError(503, "SERVICE_UNAVAILABLE")).toEqual({ notice: "unavailable" });
    expect(noticeForOrderError(400, "SOMETHING_ELSE")).toEqual({ notice: "failed" });
  });

  it("show only the shop's own words", () => {
    expect(checkoutNotice("price-changed")).toMatch(/^Prices changed/);
    expect(checkoutNotice("Call us on 123")).toBeNull();
    expect(checkoutNotice("constructor")).toBeNull();
    expect(checkoutNotice(undefined)).toBeNull();
  });
});

describe("problems", () => {
  it("separates the bag's from the address and payment ones", () => {
    const preview = {
      problems: [
        { code: "LINE_NOT_AVAILABLE", message: "Only a limited quantity…", lineId: A },
        { code: "COD_NOT_AVAILABLE", message: "…", lineId: null },
      ],
    } as CheckoutPreview;
    expect(bagProblems(preview).map((p) => p.code)).toEqual(["LINE_NOT_AVAILABLE"]);
  });
});

describe("the confirmation page", () => {
  it("says what happens next", () => {
    expect(nextSteps({ status: "CONFIRMED", paymentMethod: "COD" }).title).toBe(
      "Confirmed: pay when it arrives",
    );
    expect(nextSteps({ status: "PENDING_PAYMENT", paymentMethod: "ONLINE" }).title).toBe(
      "Awaiting payment",
    );
    expect(nextSteps({ status: "CANCELLED", paymentMethod: "ONLINE" }).title).toBe("Cancelled");
  });
});
