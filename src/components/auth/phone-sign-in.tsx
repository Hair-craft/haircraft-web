"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { localMobile } from "@/lib/account/rules";
import {
  completePhoneSignupAction,
  sendSignInCodeAction,
  verifySignInCodeAction,
  type StepResult,
} from "@/lib/session/phone-actions";
import { FormError, IndiaFlag } from "./auth-forms";

type Step = "phone" | "code" | "profile";
type Field = "phone" | "code" | "firstName" | "email";

/** Counts down to 0, one second at a time. */
export function useCountdown(): [number, (seconds: number) => void] {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return [left, setLeft];
}

/** The 6-digit code box: numbers only, filled by the phone's "code from SMS" or a paste. */
export function CodeInput({
  value,
  onChange,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <Input
      label="6-digit code"
      name="code"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={12}
      required
      autoFocus={autoFocus}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      error={error}
      className="text-center font-mono text-xl tracking-[0.5em]"
    />
  );
}

/**
 * Development only: no SMS is sent yet (the API's console driver), so the
 * code is shown here. The live shop never receives a code to show.
 */
export function TestCodeNotice({ code, onUse }: { code: string; onUse: (code: string) => void }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-gold bg-gold-light/20 px-4 py-3 text-sm"
    >
      <span>
        <strong className="text-deep">Test mode:</strong> no SMS is sent. Your code is{" "}
        <strong className="font-mono text-base tracking-widest text-deep">{code}</strong>
      </span>
      <button
        type="button"
        onClick={() => onUse(code)}
        className="rounded-full bg-deep px-3 py-1.5 text-xs font-semibold text-white hover:bg-deep-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
      >
        Use this code
      </button>
    </div>
  );
}

/**
 * "Continue with your phone number" (owner, 2026-11-04): one flow for
 * signing in and registering. Number → 6-digit code → done; a new number
 * is asked for a first name (last name and email optional) first.
 */
export function PhoneSignIn({ next, mode }: { next: string | null; mode: "sign-in" | "register" }) {
  const [step, setStep] = useState<Step>("phone");
  const [phoneText, setPhoneText] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; field?: Field } | null>(null);
  const [resendIn, setResendIn] = useCountdown();
  const [pending, start] = useTransition();
  const errorRef = useRef<HTMLDivElement>(null);

  const fail = (result: Extract<StepResult, { ok: false }>) => {
    setError({ message: result.error, field: result.field });
  };
  const fieldError = (field: Field) => (error?.field === field ? error.message : undefined);
  const topError = error && !error.field ? error.message : null;

  useEffect(() => {
    if (topError) errorRef.current?.querySelector<HTMLElement>("[data-form-error]")?.focus();
  }, [topError]);

  function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    start(async () => {
      const result = await sendSignInCodeAction(step === "phone" ? phoneText : phone);
      if (!result.ok) return fail(result);
      setPhone(result.phone);
      setCode("");
      setDevCode(result.devCode);
      setResendIn(result.resendInSeconds);
      setStep("code");
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    start(async () => {
      // A known number redirects from the server; only new numbers come back here.
      const result = await verifySignInCodeAction(phone, code, next ?? "");
      if (!result.ok) return fail(result);
      setSignupToken(result.signupToken);
      setStep("profile");
    });
  }

  function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    start(async () => {
      const result = await completePhoneSignupAction({
        signupToken,
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        email: String(form.get("email") ?? ""),
        next: next ?? "",
      });
      if (!result.ok) {
        if (/took a little too long/.test(result.error)) setStep("phone");
        fail(result);
      }
    });
  }

  if (step === "phone") {
    return (
      <form onSubmit={sendCode} noValidate className="flex flex-col gap-5">
        <div ref={errorRef}>
          <FormError message={topError} />
        </div>
        <Input
          label="Mobile number"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          required
          addon={
            <>
              <IndiaFlag />
              +91
            </>
          }
          placeholder="98765 43210"
          value={phoneText}
          onChange={(event) => setPhoneText(event.target.value)}
          error={fieldError("phone")}
          hint="We'll text you a 6-digit code."
        />
        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="h-12 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl"
        >
          {mode === "register" ? "Continue" : "Send code"}
        </Button>
      </form>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={verify} noValidate className="flex flex-col gap-5">
        <div ref={errorRef}>
          <FormError message={topError} />
        </div>
        <p className="text-sm text-muted" role="status">
          We sent a code to <strong className="text-deep">+91 {localMobile(phone)}</strong>.{" "}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("phone");
            }}
            className="font-semibold text-gold-ink underline-offset-4 hover:text-deep hover:underline"
          >
            Change number
          </button>
        </p>
        {devCode ? <TestCodeNotice code={devCode} onUse={setCode} /> : null}
        <CodeInput value={code} onChange={setCode} error={fieldError("code")} autoFocus />
        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={code.length !== 6}
          className="h-12 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl"
        >
          Verify and continue
        </Button>
        <p className="text-center text-sm text-muted">
          {resendIn > 0 ? (
            <>Didn&apos;t get it? You can ask for a new code in {resendIn}s.</>
          ) : (
            <>
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={pending}
                className="font-semibold text-gold-ink underline-offset-4 hover:text-deep hover:underline disabled:opacity-60"
              >
                Send a new code
              </button>
            </>
          )}
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={complete} noValidate className="flex flex-col gap-5">
      <div ref={errorRef}>
        <FormError message={topError} />
      </div>
      <p className="rounded-2xl bg-mint-deep px-4 py-3 text-sm" role="status">
        Number verified. You&apos;re new here: what should we call you?
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={100}
          autoFocus
          error={fieldError("firstName")}
        />
        <Input label="Last name" name="lastName" autoComplete="family-name" maxLength={100} />
      </div>
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        hint="Optional. For order emails."
        maxLength={254}
        error={fieldError("email")}
      />
      <Button
        type="submit"
        size="lg"
        loading={pending}
        className="h-12 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl"
      >
        Create my account <span aria-hidden>→</span>
      </Button>
    </form>
  );
}
