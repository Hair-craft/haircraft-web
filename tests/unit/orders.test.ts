import { describe, expect, it } from "vitest";
import {
  cancelReason,
  ORDER_FILTERS,
  ordersHref,
  paymentNote,
  progressSteps,
  readOrdersQuery,
  refundText,
  statusLabel,
  statusTone,
} from "@/lib/orders/rules";

describe("order statuses", () => {
  it("are said in the customer's words, with a colour", () => {
    expect(statusLabel("PENDING_PAYMENT")).toBe("Awaiting payment");
    expect(statusLabel("PROCESSING")).toBe("Being packed");
    expect(statusTone("PENDING_PAYMENT")).toBe("gold");
    expect(statusTone("DELIVERED")).toBe("mint");
    expect(statusTone("CANCELLED")).toBe("muted");
    expect(statusTone("SHIPPED")).toBe("deep");
  });

  it("have a filter each, after All", () => {
    expect(ORDER_FILTERS.map((f) => f.label)).toEqual([
      "All",
      "Awaiting payment",
      "Confirmed",
      "Being packed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ]);
  });
});

describe("the list's address", () => {
  it("reads a status and page, ignoring anything else", () => {
    expect(readOrdersQuery({ status: "shipped", page: "2" })).toEqual({
      status: "SHIPPED",
      page: 2,
    });
    expect(readOrdersQuery({ status: "lost", page: "-1" })).toEqual({ status: null, page: 1 });
    expect(readOrdersQuery({})).toEqual({ status: null, page: 1 });
  });

  it("writes only what's needed", () => {
    expect(ordersHref({ status: null, page: 1 })).toBe("/account/orders");
    expect(ordersHref({ status: "DELIVERED", page: 3 })).toBe(
      "/account/orders?status=delivered&page=3",
    );
  });
});

describe("the progress line", () => {
  const timeline = [
    { status: "PENDING_PAYMENT", at: "2026-10-07T04:00:00Z", note: null },
    { status: "CONFIRMED", at: "2026-10-07T04:05:00Z", note: null },
    { status: "PROCESSING", at: "2026-10-07T09:00:00Z", note: null },
  ];

  it("marks the steps reached, with their dates", () => {
    const steps = progressSteps({
      status: "PROCESSING",
      placedAt: "2026-10-07T04:00:00Z",
      timeline,
    });
    expect(steps.map((s) => [s.label, s.done])).toEqual([
      ["Placed", true],
      ["Confirmed", true],
      ["Packed", true],
      ["Shipped", false],
      ["Delivered", false],
    ]);
    expect(steps[2].at).toBe("2026-10-07T09:00:00Z");
    expect(steps[3].at).toBeNull();
  });

  it("shows only Placed for an unpaid order", () => {
    const steps = progressSteps({
      status: "PENDING_PAYMENT",
      placedAt: "2026-10-07T04:00:00Z",
      timeline: timeline.slice(0, 1),
    });
    expect(steps.filter((s) => s.done).map((s) => s.label)).toEqual(["Placed"]);
  });
});

describe("payments and refunds", () => {
  it("notes cash on delivery and refunds on the list", () => {
    expect(
      paymentNote({ status: "CONFIRMED", paymentStatus: "PENDING", paymentMethod: "COD" }),
    ).toBe("Pay on delivery");
    expect(
      paymentNote({
        status: "CANCELLED",
        paymentStatus: "REFUND_PENDING",
        paymentMethod: "ONLINE",
      }),
    ).toBe("Refund pending");
    expect(
      paymentNote({ status: "CONFIRMED", paymentStatus: "PAID", paymentMethod: "ONLINE" }),
    ).toBeNull();
  });

  it("explains a refund in plain words", () => {
    expect(refundText("REFUND_PENDING", "3999.00")).toMatch(/^Your refund of ₹3,999 has started\./);
    expect(refundText("REFUNDED", "3999.00")).toBe(
      "₹3,999 has been refunded to the method you paid with.",
    );
    expect(refundText("PAID", "3999.00")).toBeNull();
  });
});

describe("cancel reasons", () => {
  it("send the chosen reason, with any details", () => {
    expect(cancelReason("Ordered by mistake", "")).toEqual({ reason: "Ordered by mistake" });
    expect(cancelReason("Found a better price", "  elsewhere  ")).toEqual({
      reason: "Found a better price: elsewhere",
    });
  });

  it("need details for Other, and a known reason", () => {
    expect(cancelReason("Other", "no")).toEqual({
      problem: "Please tell us a little more (at least 3 characters).",
    });
    expect(cancelReason("Other", "Moving house")).toEqual({ reason: "Other: Moving house" });
    expect(cancelReason("Because", "")).toEqual({ problem: "Please choose a reason." });
  });
});
