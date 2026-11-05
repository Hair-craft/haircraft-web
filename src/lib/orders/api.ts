import "server-only";
import { apiFetch, apiFetchPage } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { PlacedOrder } from "@/lib/checkout/api";
import type { OrderStatus, TimelineEntry } from "./rules";

/** One order in the list. */
export interface OrderSummary {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  grandTotal: string;
  itemCount: number;
  firstItemName: string;
  firstItemImageUrl: string | null;
  placedAt: string;
}

/** One order in full (the confirmation page's fields, and more). */
export interface OrderDetail extends PlacedOrder {
  /** `productId` and `variantId` are null once the product has been deleted (the line keeps its own copy). */
  items: (PlacedOrder["items"][number] & { variantId: string | null; productId: string | null })[];
  tracking: OrderTracking | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  timeline: TimelineEntry[];
  canCancel: boolean;
}

export const ORDERS_PER_PAGE = 20;

export function listOrders(
  token: string,
  query: { status: OrderStatus | null; page: number },
): Promise<Paginated<OrderSummary>> {
  return apiFetchPage<OrderSummary>("/orders", {
    token,
    query: { status: query.status, page: query.page, limit: ORDERS_PER_PAGE },
  });
}

export function getOrderDetail(token: string, orderNumber: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}`, { token });
}

export function cancelOrder(
  token: string,
  orderNumber: string,
  reason: string,
): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: "POST",
    token,
    body: { reason },
  });
}

/** The courier details; `live`: followed live, through Shiprocket or directly with Delhivery or Blue Dart (owner, 2026-11-05). */
export interface OrderTracking {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  /** Older API answers leave these out. */
  live?: boolean;
  status?: string | null;
  expectedDelivery?: string | null;
  checkedAt?: string | null;
  /** Newest first. */
  scans?: { at: string; status: string; activity: string; location: string | null }[];
}
