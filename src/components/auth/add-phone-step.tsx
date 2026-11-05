"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import type { PhoneStatus } from "@/lib/session/cookies";
import {
  notePhoneAddedAction,
  savePhoneAction,
  sendPhoneChangeCodeAction,
  verifyPhoneChangeAction,
} from "@/lib/session/phone-actions";
import { FormError, IndiaFlag } from "./auth-forms";
import { CodeInput, TestCodeNotice, useCountdown } from "./code-input";

/**
 * "Add your mobile number" (owner, 2026-11-04): after a first Google sign-in,
 * or at sign-in for an older account without one. While SMS codes are on the
 * number is verified with a code; otherwise it is saved as typed.
 */
export function AddPhoneStep({
  smsOn,
  startValue,
  next,
}: {
  smsOn: boolean;
  startValue: string;
  next: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(startValue);
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [problem, setProblem] = useState<{ message: string; field?: string } | null>(null);
  const [resendIn, setResendIn] = useCountdown();
  const [pending, start] = useTransition();
  const fieldError = (field: string) => (problem?.field === field ? problem.message : undefined);
  const topError = problem && !problem.field ? problem.message : null;
  const done = () => {
    router.replace(next);
    router.refresh();
  };

  function submitNumber(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    start(async () => {
      if (!smsOn) {
        const saved = await savePhoneAction(text);
        if (!saved.ok) return setProblem({ message: saved.error, field: saved.field });
        return done();
      }
      const sent = await sendPhoneChangeCodeAction(phone ?? text);
      if (!sent.ok) return setProblem({ message: sent.error, field: sent.field });
      setPhone(sent.phone);
      setCode("");
      setDevCode(sent.devCode);
      setResendIn(sent.resendInSeconds);
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    if (!phone) return;
    setProblem(null);
    start(async () => {
      const result = await verifyPhoneChangeAction(phone, code);
      if (!result.ok) return setProblem({ message: result.error, field: result.field });
      done();
    });
  }

  if (!phone) {
    return (
      <form onSubmit={submitNumber} noValidate className="flex flex-col gap-5">
        <FormError message={topError} />
        <Input
          label="Mobile number"
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
          {smsOn ? "Send code" : "Save and continue"}
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
      <FormError message={topError} />
      {devCode ? <TestCodeNotice code={devCode} onUse={setCode} /> : null}
      <CodeInput value={code} onChange={setCode} error={fieldError("code")} autoFocus />
      <Button type="submit" size="lg" loading={pending} className="h-12 w-full">
        Verify and continue
      </Button>
      <p className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={submitNumber}
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

/** The account has its phone already: update this browser's note of it, then go on. */
export function PhoneAlreadyAdded({ status, next }: { status: PhoneStatus; next: string }) {
  useEffect(() => {
    void notePhoneAddedAction(status, next);
  }, [status, next]);
  return (
    <p role="status" className="mx-auto max-w-md px-4 py-16 text-center text-muted">
      One moment…
    </p>
  );
}
