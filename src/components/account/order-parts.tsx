import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/display";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import type { OrderSummary } from "@/lib/orders/api";
import {
  orderDate,
  orderDateTime,
  paymentNote,
  statusLabel,
  statusTone,
  type ProgressStep,
} from "@/lib/orders/rules";

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;
}

/** One order in the list, after the owner's design: the whole card opens the order. */
export function OrderCard({ order }: { order: OrderSummary }) {
  const note = paymentNote(order);
  const more = order.itemCount - 1;
  return (
    <Link
      href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
      className="group flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep sm:p-5"
    >
      <span className="flex flex-col justify-between gap-2 border-b border-[#eee7dc] pb-3 md:flex-row md:items-center">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-display text-lg font-semibold">Order {order.orderNumber}</span>
          <span aria-hidden className="text-xs text-[#727973]">
            /
          </span>
          <span className="text-sm text-muted">{orderDate(order.placedAt)}</span>
          <span aria-hidden className="text-xs text-[#727973]">
            /
          </span>
          <span className="text-base font-bold">{formatPrice(order.grandTotal)}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {note ? <span className="text-xs text-muted">{note}</span> : null}
          <StatusBadge status={order.status} />
        </span>
      </span>
      <span className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-4">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-sand-deep sm:size-20">
            {order.firstItemImageUrl ? (
              <Image
                src={order.firstItemImageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : null}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-semibold">
              {order.firstItemName}
              {more > 0 ? ` and ${more} more` : ""}
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
            </span>
          </span>
        </span>
        <span
          aria-hidden
          className="hidden shrink-0 rounded-full bg-sand px-4 py-2 text-xs font-semibold transition-colors group-hover:bg-deep group-hover:text-white sm:inline-flex"
        >
          View details →
        </span>
      </span>
    </Link>
  );
}

/** Placed → Confirmed → Packed → Shipped → Delivered: across on computers, down on phones. */
export function ProgressLine({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol aria-label="Order progress" className="flex flex-col gap-0 sm:flex-row">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className="relative flex flex-1 gap-3 pb-5 sm:flex-col sm:items-center sm:pb-0 sm:text-center"
        >
          {/* The connecting line to the next step. */}
          {i < steps.length - 1 ? (
            <span
              aria-hidden
              className={cx(
                "absolute top-8 left-[0.9375rem] h-[calc(100%-2rem)] w-1 sm:top-3.5 sm:left-[calc(50%+1rem)] sm:h-1 sm:w-[calc(100%-2rem)]",
                steps[i + 1].done ? "bg-deep" : "bg-[#eee7dc]",
              )}
            />
          ) : null}
          <span
            aria-hidden
            className={cx(
              "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm",
              step.done ? "bg-deep text-white shadow-md" : "bg-[#eee7dc] text-muted",
            )}
          >
            {step.done ? "✓" : ""}
          </span>
          <span className="sm:mt-2">
            <span className={cx("block text-sm", step.done ? "font-medium" : "text-muted")}>
              {step.label}
              <span className="sr-only">{step.done ? " (done)" : " (not yet)"}</span>
            </span>
            {step.at ? (
              <span className="block text-xs text-muted">{orderDateTime(step.at)}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
