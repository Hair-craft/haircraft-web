/**
 * My orders: rules that need no server or browser, so they are unit-tested
 * (status words, filters, the progress line, refunds, cancel reasons).
 */
import { formatPrice } from "@/lib/format";

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The customer's words for each status. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Being packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export type BadgeTone = "gold" | "deep" | "mint" | "muted";

export function statusTone(status: string): BadgeTone {
  if (status === "PENDING_PAYMENT") return "gold";
  if (status === "DELIVERED") return "mint";
  if (status === "CANCELLED") return "muted";
  return "deep";
}

export const statusLabel = (status: string) =>
  (STATUS_LABELS as Record<string, string>)[status] ?? status;

/** The filter chips on the list (the API filters by one status at a time). */
export const ORDER_FILTERS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: "All" },
  ...ORDER_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

/** The list's address-bar state: `?status=shipped&page=2` (anything else is ignored). */
export function readOrdersQuery(params: Record<string, string | string[] | undefined>): {
  status: OrderStatus | null;
  page: number;
} {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = one(params.status)?.toUpperCase();
  const page = Number(one(params.page));
  return {
    status: (ORDER_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as OrderStatus)
      : null,
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };
}

export function ordersHref(query: { status: OrderStatus | null; page: number }): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status.toLowerCase());
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/account/orders?${text}` : "/account/orders";
}

/** A line on the payment, shown when it matters (unpaid, refunds, a failed payment). */
export function paymentNote(order: {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
}): string | null {
  switch (order.paymentStatus) {
    case "REFUND_PENDING":
      return "Refund pending";
    case "REFUNDED":
      return "Refunded";
    case "PARTIALLY_REFUNDED":
      return "Partly refunded";
  }
  if (order.paymentMethod === "COD" && order.status !== "CANCELLED")
    return order.paymentStatus === "PAID" ? "Paid on delivery" : "Pay on delivery";
  return null;
}

/** What a refund means for the customer, in plain words. */
export function refundText(paymentStatus: string, amount: string): string | null {
  switch (paymentStatus) {
    case "REFUND_PENDING":
      return `Your refund of ${formatPrice(amount)} has started. It usually reaches your account in 5–7 working days, on the method you paid with.`;
    case "REFUNDED":
      return `${formatPrice(amount)} has been refunded to the method you paid with.`;
    case "PARTIALLY_REFUNDED":
      return "Part of your payment has been refunded to the method you paid with.";
  }
  return null;
}

export interface TimelineEntry {
  status: string;
  at: string;
  note: string | null;
}

export interface ProgressStep {
  label: string;
  /** When it happened (ISO), or null if not yet. */
  at: string | null;
  done: boolean;
}

/**
 * The progress line: Placed → Confirmed → Packed → Shipped → Delivered,
 * each with its date once reached. Cancelled orders show no progress line.
 */
export function progressSteps(order: {
  status: string;
  placedAt: string;
  timeline: TimelineEntry[];
}): ProgressStep[] {
  const reached = (status: string) => order.timeline.find((t) => t.status === status)?.at ?? null;
  const order_ = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const current = order_.indexOf(order.status);
  const step = (label: string, status: string, index: number): ProgressStep => {
    const at = reached(status);
    return { label, at, done: at !== null || (current >= 0 && index <= current) };
  };
  return [
    { label: "Placed", at: order.placedAt, done: true },
    step("Confirmed", "CONFIRMED", 0),
    step("Packed", "PROCESSING", 1),
    step("Shipped", "SHIPPED", 2),
    step("Delivered", "DELIVERED", 3),
  ];
}

/** The reasons offered when cancelling. */
export const CANCEL_REASONS = [
  "Ordered by mistake",
  "Want a different length or colour",
  "Found a better price",
  "Delivery takes too long",
  "Other",
] as const;

/** The reason sent to the API (3–500 characters), or the problem to show. */
export function cancelReason(
  choice: string,
  details: string,
): { reason: string } | { problem: string } {
  const extra = details.trim().replace(/\s+/g, " ");
  if (!(CANCEL_REASONS as readonly string[]).includes(choice))
    return { problem: "Please choose a reason." };
  if (choice === "Other") {
    if (extra.length < 3)
      return { problem: "Please tell us a little more (at least 3 characters)." };
    return { reason: `Other: ${extra}`.slice(0, 500) };
  }
  return { reason: (extra ? `${choice}: ${extra}` : choice).slice(0, 500) };
}

/** "7 Oct 2026". */
export function orderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** "7 Oct, 3:45 pm". */
export function orderDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
