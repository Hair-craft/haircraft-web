"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { sendCodeAction, verifyCodeAction, type Channel } from "@/lib/session/code-actions";
import { FormError } from "./auth-forms";
import { CodeInput, TestCodeNotice, useCountdown } from "./code-input";

type Problem = { message: string; field?: string } | null;

const bigButton = "h-12 w-full text-sm tracking-wider uppercase shadow-lg hover:shadow-xl";

/**
 * Sign in like Gemeria's (owner, 2026-11-06): one box for an email or a
 * mobile number → a 6-digit code sent there → signed in. There is no
 * separate "create account": a new email or number is signed straight in
 * ("we just login"), and no password: email signs in with a code too (owner,
 * 2026-11-06). Which channels work comes from the API.
 */
export function CodeSignIn({
  next,
  notice,
  emailOn,
  smsOn,
}: {
  next: string | null;
  notice: string | null;
  emailOn: boolean;
  smsOn: boolean;
}) {
  const [login, setLogin] = useState("");
  const [sent, setSent] = useState<{ channel: Channel; to: string } | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [resendIn, setResendIn] = useCountdown();
  const [pending, start] = useTransition();
  const fieldError = (field: string) => (problem?.field === field ? problem.message : undefined);
  const generalError =
    problem && !["login", "code"].includes(problem.field ?? "") ? problem.message : null;

  const label =
    emailOn && smsOn ? "Email or mobile number" : emailOn ? "Email address" : "Mobile number";

  function send(event?: FormEvent) {
    event?.preventDefault();
    setProblem(null);
    const text = sent?.to ?? login;
    // Only the channels that are on.
    if (text.includes("@") ? !emailOn : !smsOn)
      return setProblem({
        message: text.includes("@")
          ? "Please use your mobile number."
          : "Please use your email address.",
        field: "login",
      });
    start(async () => {
      const result = await sendCodeAction(text);
      if (!result.ok) return setProblem({ message: result.error, field: result.field });
      setSent({ channel: result.channel, to: result.to });
      setCode("");
      setDevCode(result.devCode);
      setResendIn(result.resendInSeconds);
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    if (!sent) return;
    setProblem(null);
    start(async () => {
      // Signs in and moves on when it works; only failures come back.
      const result = await verifyCodeAction(sent.channel, sent.to, code, next ?? "");
      if (!result.ok) setProblem({ message: result.error, field: result.field });
    });
  }

  function restart() {
    setSent(null);
    setCode("");
    setDevCode(null);
    setProblem(null);
  }

  // 1. The email or number.
  if (!sent)
    return (
      <form onSubmit={send} noValidate className="flex flex-col gap-5">
        <FormError message={notice && !problem ? notice : generalError} />
        <Input
          label={label}
          name="login"
          type={emailOn && !smsOn ? "email" : "text"}
          autoComplete={emailOn ? "username" : "tel-national"}
          inputMode={emailOn ? "email" : "tel"}
          required
          placeholder={emailOn && smsOn ? "you@example.com or 98765 43210" : undefined}
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          error={fieldError("login")}
        />
        <Button type="submit" size="lg" loading={pending} className={bigButton}>
          Continue
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted">
          We&apos;ll send you a 6-digit code. By continuing you agree to our{" "}
          <Link href="/terms" className="font-semibold text-deep underline underline-offset-2">
            Terms of use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-deep underline underline-offset-2">
            Privacy policy
          </Link>
          .
        </p>
      </form>
    );

  // 2. The code.
  return (
    <form onSubmit={verify} noValidate className="flex flex-col gap-5">
      <p role="status" className="text-sm text-muted">
        We&apos;ve {sent.channel === "email" ? "emailed" : "texted"} a 6-digit code to{" "}
        <strong className="text-deep">{sent.to.replace(/^\+91/, "+91 ")}</strong>.
        {sent.channel === "email" ? " Check your spam folder if it isn't there." : null}
      </p>
      <FormError message={generalError ?? fieldError("login") ?? null} />
      {devCode ? <TestCodeNotice code={devCode} onUse={setCode} /> : null}
      <CodeInput value={code} onChange={setCode} error={fieldError("code")} autoFocus />
      <Button type="submit" size="lg" loading={pending} className={bigButton}>
        Continue
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
          onClick={restart}
          className="font-semibold text-deep underline-offset-4 hover:underline"
        >
          {sent.channel === "email" ? "Change email" : "Change number"}
        </button>
      </p>
    </form>
  );
}
