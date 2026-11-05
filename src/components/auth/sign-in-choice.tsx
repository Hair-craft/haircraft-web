"use client";

import Link from "next/link";
import { useId, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { cx } from "@/lib/cx";
import { sendSignInCodeAction, verifySignInCodeAction } from "@/lib/session/phone-actions";
import { FormError, IndiaFlag, SignInForm } from "./auth-forms";
import { CodeInput, TestCodeNotice, useCountdown } from "./code-input";

type Method = "password" | "otp";

/**
 * Sign in with the email or phone number and the password, or with the phone
 * number and a code texted to it (owner, 2026-11-05). A toggle chooses; the
 * code option is there only while SMS codes are on.
 */
export function SignInChoice({
  next,
  notice,
  smsOn,
}: {
  next: string | null;
  notice: string | null;
  smsOn: boolean;
}) {
  const [method, setMethod] = useState<Method>("password");
  const base = useId();
  if (!smsOn) return <SignInForm next={next} notice={notice} />;

  const options: { key: Method; label: string }[] = [
    { key: "password", label: "Password" },
    { key: "otp", label: "OTP on phone" },
  ];
  // Arrow keys move between the two, as in any tab list.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const other = method === "password" ? "otp" : "password";
    setMethod(other);
    document.getElementById(`${base}-tab-${other}`)?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="How to sign in"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 rounded-full bg-sand p-1"
      >
        {options.map((option) => (
          <button
            key={option.key}
            id={`${base}-tab-${option.key}`}
            type="button"
            role="tab"
            aria-selected={method === option.key}
            aria-controls={`${base}-panel`}
            tabIndex={method === option.key ? 0 : -1}
            onClick={() => setMethod(option.key)}
            className={cx(
              "min-h-10 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
              method === option.key ? "bg-white text-deep shadow-sm" : "text-muted hover:text-deep",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${method}`}>
        {method === "password" ? (
          <SignInForm next={next} notice={notice} />
        ) : (
          <OtpSignIn next={next} />
        )}
      </div>
    </div>
  );
}

/** The phone number, then the 6-digit code from the SMS; then signed in. */
function OtpSignIn({ next }: { next: string | null }) {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [problem, setProblem] = useState<{
    message: string;
    field?: string;
    noAccount?: boolean;
  } | null>(null);
  const [resendIn, setResendIn] = useCountdown();
  const [pending, start] = useTransition();
  const fieldError = (field: string) => (problem?.field === field ? problem.message : undefined);
  const registerHref = `/register${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  function send(event?: FormEvent) {
    event?.preventDefault();
    setProblem(null);
    start(async () => {
      const result = await sendSignInCodeAction(phone ?? text);
      if (!result.ok) return setProblem({ message: result.error, field: result.field });
      setPhone(result.phone);
      setCode("");
      setDevCode(result.devCode);
      setResendIn(result.resendInSeconds);
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    if (!phone) return;
    setProblem(null);
    start(async () => {
      // Signs in and moves on when it works; only failures come back.
      const result = await verifySignInCodeAction(phone, code, next ?? "");
      if (result.ok) return;
      setProblem({
        message: result.error,
        field: "field" in result ? result.field : undefined,
        noAccount: "noAccount" in result,
      });
    });
  }

  if (!phone) {
    return (
      <form onSubmit={send} noValidate className="flex flex-col gap-5">
        <FormError message={problem && !problem.field ? problem.message : null} />
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
          value={text}
          onChange={(event) => setText(event.target.value)}
          error={fieldError("phone")}
        />
        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="mt-2 h-12 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl"
        >
          Send code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} noValidate className="flex flex-col gap-5">
      <p role="status" className="text-sm text-muted">
        We&apos;ve texted a 6-digit code to{" "}
        <strong className="text-deep">{phone.replace(/^\+91/, "+91 ")}</strong>.
      </p>
      {problem?.noAccount ? (
        <p role="alert" className="rounded-2xl bg-sand px-4 py-3 text-sm">
          {problem.message}{" "}
          <Link
            href={registerHref}
            className="font-semibold text-deep underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      ) : (
        <FormError message={problem && !problem.field ? problem.message : null} />
      )}
      {devCode ? <TestCodeNotice code={devCode} onUse={setCode} /> : null}
      <CodeInput value={code} onChange={setCode} error={fieldError("code")} autoFocus />
      <Button
        type="submit"
        size="lg"
        loading={pending}
        className="h-12 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl"
      >
        Sign in
      </Button>
      <p className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => send()}
          disabled={resendIn > 0 || pending}
          className="font-semibold text-deep underline-offset-4 hover:underline disabled:text-muted disabled:no-underline"
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPhone(null);
            setCode("");
            setDevCode(null);
            setProblem(null);
          }}
          className="font-semibold text-deep underline-offset-4 hover:underline"
        >
          Change number
        </button>
      </p>
    </form>
  );
}
