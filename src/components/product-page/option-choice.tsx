import type { MouseEvent, ReactNode } from "react";
import type { Axis, Value } from "@/lib/product/variants";
import { valueLabel } from "@/lib/product/variants";
import { swatchFor } from "@/lib/product/swatch";
import { cx } from "@/lib/cx";

export type ChoiceStatus = "available" | "soldout" | "elsewhere";

/**
 * Small line drawings for hair textures (owner, 2026-11-06: "icons, smart and
 * minimal"), matched on the texture's name; unknown textures get none.
 */
const TEXTURE_ICONS: [RegExp, string][] = [
  [
    /kinky|afro|coily/i,
    "M5 3l3 3-3 3 3 3-3 3 3 3-3 3M12 3l3 3-3 3 3 3-3 3 3 3-3 3M19 3l-2 3 2 3-2 3 2 3-2 3 2 3",
  ],
  [
    /curl/i,
    "M6 3c3 0 3 3 0 3s-3 3 0 3 3 3 0 3-3 3 0 3 3 3 0 3M14 3c3 0 3 3 0 3s-3 3 0 3 3 3 0 3-3 3 0 3 3 3 0 3",
  ],
  [
    /deep wave|water wave/i,
    "M6 3c3 2 3 4 0 6s-3 4 0 6 3 4 0 6M12 3c3 2 3 4 0 6s-3 4 0 6 3 4 0 6M18 3c3 2 3 4 0 6s-3 4 0 6 3 4 0 6",
  ],
  [
    /wav/i,
    "M6 3c2.5 3 2.5 6 0 9s-2.5 6 0 9M12 3c2.5 3 2.5 6 0 9s-2.5 6 0 9M18 3c2.5 3 2.5 6 0 9s-2.5 6 0 9",
  ],
  [/straight|silky|sleek/i, "M7 3v18M12 3v18M17 3v18"],
];

export function textureIcon(texture: string): string | null {
  return TEXTURE_ICONS.find(([pattern]) => pattern.test(texture))?.[1] ?? null;
}

/** A tiny ruler, beside the "Length" label. */
export function RulerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="inline-block align-[-2px]"
    >
      <path d="M3 15 15 3l6 6L9 21zM7 11l2 2M10 8l2 2M13 5l2 2" />
    </svg>
  );
}

const statusText = (status: ChoiceStatus) =>
  status === "soldout"
    ? ", sold out"
    : status === "elsewhere"
      ? ", changes your other choices"
      : "";

/**
 * One choice in an option row, by kind (owner, 2026-11-06):
 * - colour: a round swatch (the uploaded swatch photo, else the shade's colour), the name for screen readers and on hover;
 * - length: a compact pill, 16″;
 * - texture: a pill with a small line drawing;
 * - size: a pill with the size.
 * The link's name is always the full value ("18 inch", "Natural Black"…).
 */
export function OptionChoice({
  axis,
  value,
  href,
  chosen,
  status,
  swatchImage,
  swatchHidden = false,
  onClick,
}: {
  axis: Axis;
  value: Value;
  href: string;
  chosen: boolean;
  status: ChoiceStatus;
  /** The colour's swatch photo, when one was uploaded in the admin. */
  swatchImage?: string | null;
  /** Hidden in the admin: no round swatch; the colour is a text button like the others. */
  swatchHidden?: boolean;
  onClick: (event: MouseEvent) => void;
}) {
  const label = valueLabel(axis, value);
  const common =
    "relative inline-flex items-center justify-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";
  const hidden: ReactNode = <span className="sr-only">{label + statusText(status)}</span>;

  if (axis === "color" && !swatchHidden)
    return (
      <a
        href={href}
        onClick={onClick}
        aria-current={chosen || undefined}
        title={label}
        data-swatch
        data-no-progress
        className={cx(
          common,
          "size-10 rounded-full p-[3px] ring-offset-2",
          chosen
            ? "ring-2 ring-deep"
            : status === "elsewhere"
              ? "opacity-60 ring-1 ring-deep/30 hover:opacity-100"
              : "ring-1 ring-black/10 hover:ring-deep/50",
        )}
      >
        <span
          aria-hidden
          className="block size-full rounded-full bg-cover bg-center ring-1 ring-black/10 ring-inset"
          style={
            swatchImage
              ? { backgroundImage: `url("${swatchImage}")` }
              : { background: swatchFor(String(value)) }
          }
        />
        {status === "soldout" ? (
          // A diagonal line across a sold-out shade.
          <span
            aria-hidden
            className="absolute inset-0 m-auto h-px w-[130%] -rotate-45 bg-deep/70"
          />
        ) : null}
        {hidden}
      </a>
    );

  const icon = axis === "texture" ? textureIcon(String(value)) : null;
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={chosen || undefined}
      data-no-progress
      className={cx(
        common,
        "h-9 min-w-11 gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-semibold",
        chosen
          ? "border-deep bg-deep text-white shadow-sm"
          : status === "elsewhere"
            ? "border-dashed border-deep/30 bg-transparent text-muted hover:border-deep/60"
            : "border-line bg-white hover:border-deep/50",
        status === "soldout" && "line-through decoration-1",
      )}
    >
      {icon ? (
        <svg
          viewBox="0 0 24 24"
          width={16}
          height={16}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d={icon} />
        </svg>
      ) : null}
      {axis === "lengthInches" ? (
        <>
          <span aria-hidden>{value}″</span>
          {hidden}
        </>
      ) : (
        <>
          <span aria-hidden>{label}</span>
          {hidden}
        </>
      )}
    </a>
  );
}
