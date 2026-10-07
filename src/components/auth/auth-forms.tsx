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
        <label htmlFor={id} className="text-sm font-medium text-deep">
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
          className="rounded-md px-1 text-xs font-medium text-deep/70 hover:text-deep focus-visible:outline-2 focus-visible:outline-deep"
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
          "h-11 w-full rounded-xl border bg-white/80 px-4 text-deep transition-colors focus-visible:border-deep focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-deep/40",
          error ? "border-red-600" : "border-deep/20",
        )}
      />
      {showRules ? (
        <ul id={rulesId} className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {passwordChecks(value).map((rule) => (
            <li key={rule.label} className={rule.met ? "text-emerald-700" : "text-deep/70"}>
              <span aria-hidden>{rule.met ? "✓ " : "○ "}</span>
              {rule.label}
              <span className="sr-only">{rule.met ? " (done)" : " (needed)"}</span>
            </li>
          ))}
        </ul>
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
          className="text-sm text-deep/70 underline-offset-4 hover:text-deep hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Sign in
      </Button>
    </form>
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
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Create account
      </Button>
    </form>
  );
}
