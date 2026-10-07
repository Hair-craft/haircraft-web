import { cx } from "@/lib/cx";

export type StarFill = "full" | "half" | "empty";

/** 4.3 → ★★★★½ (rounded to the nearest half star), always five entries. */
export function starFills(rating: number): StarFill[] {
  const halves = Math.round(Math.min(5, Math.max(0, rating)) * 2);
  return Array.from({ length: 5 }, (_, i) =>
    halves >= (i + 1) * 2 ? "full" : halves === i * 2 + 1 ? "half" : "empty",
  );
}

/** What a screen reader hears: "Rated 4.3 out of 5, 12 reviews". */
export function ratingLabel(rating: number, reviewCount: number): string {
  const value = Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
  return `Rated ${value} out of 5, ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`;
}

const STAR = "M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z";

/** Five small stars and the review count, e.g. ★★★★½ (12). */
export function RatingStars({
  rating,
  reviewCount,
  className,
}: {
  rating: number;
  reviewCount: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={ratingLabel(rating, reviewCount)}
      className={cx("inline-flex items-center gap-1.5 text-xs", className)}
    >
      <span className="inline-flex" aria-hidden>
        {starFills(rating).map((fill, i) => (
          <svg key={i} viewBox="0 0 24 24" width={14} height={14}>
            <path
              d={STAR}
              stroke="var(--gold)"
              strokeWidth={1.4}
              strokeLinejoin="round"
              fill={fill === "full" ? "var(--gold)" : "none"}
            />
            {fill === "half" ? (
              // The left half of a filled star, cut by a narrower viewport (no ids needed).
              <svg viewBox="0 0 12 24" width={12} height={24} overflow="hidden">
                <path d={STAR} fill="var(--gold)" />
              </svg>
            ) : null}
          </svg>
        ))}
      </span>
      <span aria-hidden className="text-deep/70">
        ({reviewCount})
      </span>
    </span>
  );
}
