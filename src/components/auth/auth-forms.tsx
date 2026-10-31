"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { cx } from "@/lib/cx";
import { registerAction, signInAction, type AuthFormState } from "@/lib/session/actions";
import { PASSWORD_MAX_BYTES, passwordChecks } from "@/lib/session/rules";

export const EMPTY: AuthFormState = { error: null, fields: {}, values: {} };

/** After a failed attempt, move the focus to the first field with a problem (or the message). */
export function useFocusFirstProblem(state: { error: string | null }) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.error) return;
    const field = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (field ?? form.current?.querySelector<HTMLElement>("[data-form-error]"))?.focus();
  }, [state]);
  return form;
}

export function FormError({
  message,
  children,
}: {
  message: string | null;
  children?: React.ReactNode;
}) {
  if (!message) return null;
  return (
    <div
      data-form-error
      tabIndex={-1}
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 focus:outline-none"
    >
      {message}
      {children}
    </div>
  );
}

/** A password box with Show/Hide and, when creating one, the rules ticked off while typing. */
export function PasswordField({
  label,
  name = "password",
  autoComplete,
  error,
  showRules = false,
}: {
  label: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  showRules?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const rulesId = `${id}-rules`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold tracking-wide text-deep">
          {label}
          <span aria-hidden className="ml-0.5 text-gold">
            *
          </span>
        </label>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={id}
          aria-pressed={visible}
          className="rounded-md px-1 text-xs font-medium text-muted hover:text-deep focus-visible:outline-2 focus-visible:outline-deep"
        >
          {visible ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </div>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        maxLength={PASSWORD_MAX_BYTES * 4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error ? `${id}-error` : null, showRules ? rulesId : null].filter(Boolean).join(" ") ||
          undefined
        }
        className={cx(
          "h-12 w-full rounded-lg border bg-sand px-4 text-deep shadow-sm transition-colors focus-visible:border-deep focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-deep/40",
          error ? "border-red-600" : "border-line",
        )}
      />
      {showRules ? (
        <div className="mt-1 flex flex-col gap-2 rounded-lg bg-sand p-3">
          <p className="flex items-center justify-between text-[0.625rem] font-semibold tracking-wider text-muted uppercase">
            Password strength
            <span className="font-bold text-sage-ink">
              {passwordChecks(value).filter((rule) => rule.met).length} of{" "}
              {passwordChecks(value).length}
            </span>
          </p>
          <div aria-hidden className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-[#eee7dc]">
            {passwordChecks(value).map((rule) => (
              <span
                key={rule.label}
                className={cx(
                  "h-full flex-1 rounded-full transition-colors",
                  rule.met ? "bg-deep" : "bg-transparent",
                )}
              />
            ))}
          </div>
          <ul id={rulesId} className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {passwordChecks(value).map((rule) => (
              <li
                key={rule.label}
                className={rule.met ? "font-medium text-sage-ink" : "text-muted"}
              >
                <span aria-hidden>{rule.met ? "✓ " : "○ "}</span>
                {rule.label}
                <span className="sr-only">{rule.met ? " (done)" : " (needed)"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SignInForm({ next, notice }: { next: string | null; notice?: string | null }) {
  const [state, action, pending] = useActionState(signInAction, EMPTY);
  const form = useFocusFirstProblem(state);
  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-5">
      {notice && !state.error ? (
        <p role="status" className="rounded-2xl bg-mint-deep px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}
      <FormError message={state.error} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values.email}
        error={state.fields.email}
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        error={state.fields.password}
      />
      <div className="-mt-2 text-right">
        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-gold-ink underline-offset-4 transition-colors hover:text-deep hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        className="mt-2 h-12 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl"
      >
        Sign in
      </Button>
    </form>
  );
}

/** India's flag, drawn (emoji flags show as letters on Windows). */
function IndiaFlag() {
  return (
    <svg viewBox="0 0 640 480" className="h-3.5 w-5 overflow-hidden rounded-[2px]">
      <path d="M0 0h640v160H0z" fill="#f93" />
      <path d="M0 160h640v160H0z" fill="#fff" />
      <path d="M0 320h640v160H0z" fill="#128807" />
      <circle cx="320" cy="240" r="40" fill="#008" />
    </svg>
  );
}

export function RegisterForm({ next }: { next: string | null }) {
  const [state, action, pending] = useActionState(registerAction, EMPTY);
  const form = useFocusFirstProblem(state);
  const signInHref = `/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-5">
      <FormError message={state.error}>
        {state.emailTaken ? (
          <>
            {" "}
            <Link href={signInHref} className="font-medium underline underline-offset-4">
              Sign in instead
            </Link>
          </>
        ) : null}
      </FormError>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={100}
          defaultValue={state.values.firstName}
          error={state.fields.firstName}
        />
        <Input
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          maxLength={100}
          defaultValue={state.values.lastName}
          error={state.fields.lastName}
        />
      </div>
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values.email}
        error={state.fields.email}
      />
      <Input
        label="Mobile number"
        name="phone"
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        addon={
          <>
            <IndiaFlag />
            +91
          </>
        }
        placeholder="98765 43210"
        hint="Optional. For delivery updates, e.g. 98765 43210."
        defaultValue={state.values.phone}
        error={state.fields.phone}
      />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        error={state.fields.password}
        showRules
      />
      <p className="text-sm leading-relaxed text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-semibold text-deep underline underline-offset-2">
          Terms of use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-deep underline underline-offset-2">
          Privacy policy
        </Link>
        .
      </p>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        className="h-14 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl"
      >
        Create account <span aria-hidden>→</span>
      </Button>
    </form>
  );
}
