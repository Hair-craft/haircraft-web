import Image from "next/image";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { isFree, type CheckoutTotals } from "@/lib/checkout/rules";

export interface SummaryLine {
  key: string;
  name: string;
  /** null when the product no longer exists: the name shows without a link. */
  slug: string | null;
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
        <li key={line.key} className="flex gap-3.5 rounded-xl bg-sand/60 p-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm">
            {line.image ? (
              <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <PhotoPlaceholder size="small" />
            )}
            <span className="absolute -top-0 -right-0 flex min-w-5 items-center justify-center rounded-bl-xl bg-deep px-1 text-[0.7rem] leading-5 font-semibold text-white">
              <span className="sr-only">Quantity </span>
              {line.quantity}
            </span>
          </div>
          <div className="min-w-0 flex-1 text-sm">
            {line.slug ? (
              <Link
                href={`/product/${encodeURIComponent(line.slug)}`}
                className="font-semibold underline-offset-4 hover:underline"
              >
                {line.name}
              </Link>
            ) : (
              <span className="font-medium">{line.name}</span>
            )}
            <p className="text-muted">{line.option}</p>
            {line.problem ? <p className="mt-1 text-red-800">{line.problem}</p> : null}
          </div>
          <p className="text-base font-bold tracking-tight">{formatPrice(line.lineTotal)}</p>
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
        {row(<span className="text-muted">Subtotal</span>, formatPrice(totals.subtotal))}
        {Number(totals.discount) > 0
          ? row(
              couponCode ? `Discount (${couponCode})` : "Discount",
              `−${formatPrice(totals.discount)}`,
              "text-emerald-800",
            )
          : null}
        {row(
          <span className="text-muted">Shipping</span>,
          isFree(totals.shipping) ? (
            <span className="font-bold text-sage-ink uppercase">Free</span>
          ) : (
            formatPrice(totals.shipping)
          ),
        )}
        {row(
          <span className="flex flex-col">
            <span className="font-display text-lg font-semibold">Total</span>
            <span className="text-xs text-muted">
              Includes {formatPrice(totals.gstIncluded)} GST
            </span>
          </span>,
          <span className="font-display text-[2rem] leading-none font-medium">
            {formatPrice(totals.grandTotal)}
          </span>,
          "mt-2 rounded-xl bg-sand px-4 py-4",
        )}
      </dl>
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
      className="flex flex-col rounded-xl bg-white p-6 shadow-sm"
    >
      <h2
        id={`step-${number}`}
        className="mb-5 flex items-center gap-2.5 font-display text-lg font-semibold"
      >
        <span
          aria-hidden
          className="flex size-7 items-center justify-center rounded-full bg-deep font-sans text-xs text-white"
        >
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
