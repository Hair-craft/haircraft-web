import type { ReactNode } from "react";

/** The centred card that holds the sign-in, register and password pages. */
export function AuthCard({
  eyebrow,
  title,
  intro,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-[2rem] bg-white/80 px-6 py-10 shadow-xl ring-1 shadow-deep/5 ring-deep/5 sm:px-10">
        <p className="text-center text-xs tracking-[0.35em] text-deep-soft uppercase">{eyebrow}</p>
        <h1 className="mt-3 text-center font-display text-4xl">{title}</h1>
        {intro ? <div className="mt-3 text-center text-sm text-deep/70">{intro}</div> : null}
        <div className="mt-8">{children}</div>
      </div>
      {footer ? <div className="mt-6 text-center text-sm text-deep/75">{footer}</div> : null}
    </div>
  );
}
