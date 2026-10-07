import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * The references' section heading: a small caps line above a calm serif
 * title, centred, with an optional link underneath (e.g. "View all").
 */
export function SectionHeader({
  id,
  eyebrow,
  title,
  intro,
  action,
  align = "center",
  className,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  action?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cx(align === "center" ? "mx-auto text-center" : "", "max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="mt-3 font-display text-4xl leading-tight md:text-5xl">
        {title}
      </h2>
      {intro ? <p className="mt-4 text-deep/70">{intro}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
