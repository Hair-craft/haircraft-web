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
      <div className="relative overflow-hidden rounded-xl bg-white px-6 py-10 shadow-xl sm:px-10">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-deep via-gold-light to-deep"
        />
        <p className="text-center text-[0.7rem] font-bold tracking-[0.2em] text-gold-ink uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-center font-display text-3xl font-semibold">{title}</h1>
        {intro ? <div className="mt-3 text-center text-sm text-muted">{intro}</div> : null}
        <div className="mt-8">{children}</div>
      </div>
      {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
    </div>
  );
}
