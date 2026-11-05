"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { resetPasswordAction, sendResetCodeAction } from "@/lib/session/phone-actions";
import { FormError, IndiaFlag, PasswordField } from "./auth-forms";
import { CodeInput, TestCodeNotice, useCountdown } from "./code-input";

/**
 * A forgotten password, reset with a code texted to the account's mobile
 * number (owner, 2026-11-04): number → code and new password → signed in.
 * The first step answers the same whether or not the number has an account.
 */
export function ForgotPasswordFlow({ next }: { next: string | null }) {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [problem, setProblem] = useState<{ message: string; field?: string } | null>(null);
  const [resendIn, setResendIn] = useCountdown();
  const [pending, start] = useTransition();
  const fieldError = (field: string) => (problem?.field === field ? problem.message : undefined);
  const topError = problem && !problem.field ? problem.message : null;

  function send(event?: FormEvent) {
    event?.preventDefault();
    setProblem(null);
    start(async () => {
      const result = await sendResetCodeAction(phone ?? text);
      if (!result.ok) return setProblem({ message: result.error, field: result.field });
      setPhone(result.phone);
      setCode("");
      setDevCode(result.devCode);
      setResendIn(result.resendInSeconds);
    });
  }

  function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone) return;
    const newPassword = String(new FormData(event.currentTarget).get("newPassword") ?? "");
    setProblem(null);
    start(async () => {
      // Signs in and moves on when it works; only failures come back.
      const result = await resetPasswordAction({ phone, code, newPassword, next: next ?? "" });
      if (!result.ok) setProblem({ message: result.error, field: result.field });
    });
  }

  if (!phone) {
    return (
      <form onSubmit={send} noValidate className="flex flex-col gap-5">
        <FormError message={topError} />
        <Input
          label="Mobile number on your account"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          required
          autoFocus
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
        <Button type="submit" size="lg" loading={pending} className="h-12 w-full">
          Send code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={reset} noValidate className="flex flex-col gap-5">
      <p role="status" className="text-sm text-muted">
        If <strong className="text-deep">{phone.replace(/^\+91/, "+91 ")}</strong> has an account,
        we&apos;ve texted it a 6-digit code.
      </p>
      <FormError message={topError} />
      {devCode ? <TestCodeNotice code={devCode} onUse={setCode} /> : null}
      <CodeInput value={code} onChange={setCode} error={fieldError("code")} autoFocus />
      <PasswordField
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        error={fieldError("newPassword")}
        showRules
      />
      <Button type="submit" size="lg" loading={pending} className="h-12 w-full">
        Reset password and sign in
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
          Use another number
        </button>
      </p>
    </form>
  );
}
