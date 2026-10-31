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
        <p className="text-[0.65rem] font-bold tracking-[0.2em] text-gold-ink uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="mt-2 font-display text-2xl leading-tight font-medium tracking-tight sm:text-[2rem] sm:leading-10"
      >
        {title}
      </h2>
      {intro ? <p className="mt-3 text-muted">{intro}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
