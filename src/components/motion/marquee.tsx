import { cx } from "@/lib/cx";

/**
 * A slow, endless strip of short messages (CSS only, no JavaScript).
 * Screen readers hear the list once; the duplicate that makes the loop
 * seamless is hidden from them. It pauses on hover, and stands still
 * (centred, wrapping) for people who prefer reduced motion.
 */
export function Marquee({
  items,
  label,
  className,
  itemClassName,
  speedSeconds = 40,
  repeat = 1,
}: {
  items: string[];
  /** What the strip is, for screen readers, e.g. "Offers". */
  label: string;
  className?: string;
  itemClassName?: string;
  speedSeconds?: number;
  /** Repeats a short list so one copy is wider than the screen; repeats are hidden from screen readers. */
  repeat?: number;
}) {
  const shown = Array.from({ length: repeat }, () => items).flat();
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="hc-marquee-list flex shrink-0 items-center">
      {shown.map((item, i) => (
        <li
          key={i}
          aria-hidden={(!hidden && i >= items.length) || undefined}
          className={cx("flex items-center whitespace-nowrap", itemClassName)}
        >
          <span>{item}</span>
          <span aria-hidden className="mx-6 text-gold sm:mx-10">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={label} className={cx("hc-marquee overflow-hidden", className)}>
      <div
        className="hc-marquee-track flex w-max"
        style={{ ["--hc-marquee-duration" as string]: `${speedSeconds}s` }}
      >
        {list(false)}
        {list(true)}
      </div>
    </section>
  );
}
