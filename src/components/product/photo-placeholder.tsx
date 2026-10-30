import Image from "next/image";
import { cx } from "@/lib/cx";

/**
 * Stands in for a product photo when a product has none (photos are
 * optional): the HairCraft logo, softly, on the shop's mint. Decorative, so
 * it is hidden from screen readers (the product's name is next to it).
 */
export function PhotoPlaceholder({
  className,
  size = "large",
}: {
  className?: string;
  /** small: thumbnails in the bag, checkout and search. */
  size?: "small" | "large";
}) {
  return (
    <div
      aria-hidden
      data-testid="photo-placeholder"
      className={cx(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-mint to-mint-deep",
        className,
      )}
    >
      <Image
        src="/images/logo.png"
        alt=""
        width={1240}
        height={1088}
        className={cx("h-auto opacity-35", size === "small" ? "w-3/5" : "w-2/5")}
      />
    </div>
  );
}
