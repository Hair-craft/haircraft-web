import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { isFree, type CheckoutTotals } from "@/lib/checkout/rules";

export interface SummaryLine {
  key: string;
  name: string;
  slug: string;
  option: string;
  image: string | null;
  quantity: number;
  lineTotal: string;
  problem?: string | null;
}

/** The items being ordered: a small photo, name, option, quantity and line total. */
export function SummaryLines({ lines }: { lines: SummaryLine[] }) {
  return (
    <ul aria-label="Items in your order" className="flex flex-col gap-4">
      {lines.map((line) => (
        <li key={line.key} className="flex gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white">
            {line.image ? (
              <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
            ) : null}
            <span className="absolute -top-0 -right-0 flex min-w-5 items-center justify-center rounded-bl-xl bg-deep px-1 text-[0.7rem] leading-5 font-semibold text-mint">
              <span className="sr-only">Quantity </span>
              {line.quantity}
            </span>
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <Link
              href={`/product/${encodeURIComponent(line.slug)}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {line.name}
            </Link>
            <p className="text-deep/70">{line.option}</p>
            {line.problem ? <p className="mt-1 text-red-800">{line.problem}</p> : null}
          </div>
          <p className="text-sm font-medium">{formatPrice(line.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Subtotal, discount, shipping, total and the GST included. */
export function TotalsList({
  totals,
  couponCode,
}: {
  totals: Pick<CheckoutTotals, "subtotal" | "discount" | "shipping" | "grandTotal" | "gstIncluded">;
  couponCode?: string | null;
}) {
  const row = (label: ReactNode, value: ReactNode, className?: string) => (
    <div className={cx("flex items-baseline justify-between gap-4", className)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
  return (
    <div className="flex flex-col gap-2 text-sm">
      <dl className="flex flex-col gap-2">
        {row("Subtotal", formatPrice(totals.subtotal))}
        {Number(totals.discount) > 0
          ? row(
              couponCode ? `Discount (${couponCode})` : "Discount",
              `−${formatPrice(totals.discount)}`,
              "text-emerald-800",
            )
          : null}
        {row("Shipping", isFree(totals.shipping) ? "Free" : formatPrice(totals.shipping))}
        {row(
          <span className="font-display text-xl">Total</span>,
          <span className="text-lg font-semibold">{formatPrice(totals.grandTotal)}</span>,
          "mt-2 border-t border-deep/10 pt-3",
        )}
      </dl>
      <p className="text-right text-xs text-deep/70">
        Includes {formatPrice(totals.gstIncluded)} GST
      </p>
    </div>
  );
}

/** A numbered checkout section. */
export function CheckoutSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${number}`}
      className="rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5 sm:p-8"
    >
      <h2 id={`step-${number}`} className="mb-5 flex items-center gap-3 font-display text-2xl">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-deep font-sans text-sm text-mint"
        >
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
