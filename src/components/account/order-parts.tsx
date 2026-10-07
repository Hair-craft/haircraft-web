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

/** One order in the list: the whole card opens the order. */
export function OrderCard({ order }: { order: OrderSummary }) {
  const note = paymentNote(order);
  const more = order.itemCount - 1;
  return (
    <Link
      href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
      className="flex items-center gap-4 rounded-[2rem] bg-white/80 p-4 ring-1 ring-deep/5 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep sm:p-5"
    >
      <div className="relative size-18 shrink-0 overflow-hidden rounded-2xl bg-mint">
        {order.firstItemImageUrl ? (
          <Image src={order.firstItemImageUrl} alt="" fill sizes="72px" className="object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{order.orderNumber}</p>
          <StatusBadge status={order.status} />
          {note ? <span className="text-xs text-deep/70">{note}</span> : null}
        </div>
        <p className="mt-1 truncate text-sm text-deep/75">
          {order.firstItemName}
          {more > 0 ? ` and ${more} more` : ""}
        </p>
        <p className="mt-0.5 text-sm text-deep/70">
          {orderDate(order.placedAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </p>
      </div>
      <p className="shrink-0 font-semibold">{formatPrice(order.grandTotal)}</p>
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
                "absolute top-6 left-3 h-[calc(100%-1.5rem)] w-0.5 sm:top-3 sm:left-[calc(50%+0.75rem)] sm:h-0.5 sm:w-[calc(100%-1.5rem)]",
                steps[i + 1].done ? "bg-deep" : "bg-deep/15",
              )}
            />
          ) : null}
          <span
            aria-hidden
            className={cx(
              "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
              step.done ? "bg-deep text-mint" : "border-2 border-deep/20 bg-white",
            )}
          >
            {step.done ? "✓" : ""}
          </span>
          <span className="sm:mt-2">
            <span className={cx("block text-sm", step.done ? "font-medium" : "text-deep/70")}>
              {step.label}
              <span className="sr-only">{step.done ? " (done)" : " (not yet)"}</span>
            </span>
            {step.at ? (
              <span className="block text-xs text-deep/70">{orderDateTime(step.at)}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
