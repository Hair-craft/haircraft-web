import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { formatPrice, formatPriceRange } from "@/lib/format";

/** Small display pieces: badge, price, skeleton. */

type BadgeTone = "deep" | "gold" | "mint" | "muted" | "danger";

const tones: Record<BadgeTone, string> = {
  deep: "bg-deep text-mint",
  gold: "bg-gold/90 text-deep",
  mint: "bg-mint-deep text-deep",
  muted: "bg-deep/10 text-deep/80",
  danger: "bg-red-100 text-red-800",
};

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A price from the API's decimal string. With `compareAt` (the list price
 * when on sale) the old price is shown struck through, and screen readers
 * hear "Sale price … , was …".
 */
export function Price({
  amount,
  compareAt,
  className,
}: {
  amount: string;
  compareAt?: string | null;
  className?: string;
}) {
  if (compareAt && compareAt !== amount) {
    return (
      <span className={cx("inline-flex items-baseline gap-2", className)}>
        <span className="font-semibold text-deep">
          <span className="sr-only">Sale price </span>
          {formatPrice(amount)}
        </span>
        <s className="text-sm text-deep/70">
          <span className="sr-only">, was </span>
          {formatPrice(compareAt)}
        </s>
      </span>
    );
  }
  return <span className={cx("font-semibold text-deep", className)}>{formatPrice(amount)}</span>;
}

export function PriceRange({
  min,
  max,
  className,
}: {
  min: string;
  max: string;
  className?: string;
}) {
  return (
    <span className={cx("font-semibold text-deep", className)}>
      {min !== max ? <span className="sr-only">From </span> : null}
      {formatPriceRange(min, max)}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cx("block animate-pulse rounded-lg bg-deep/10", className)} />
  );
}
