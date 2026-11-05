"use client";

import { useEffect, useState, useTransition, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { checkRegisterCodeAction, sendRegisterCodeAction } from "@/lib/session/phone-actions";
import { IndiaFlag } from "./auth-forms";
import { CodeInput, TestCodeNotice, useCountdown } from "./code-input";

type Step = "enter" | "code" | "verified";

/**
 * The create-account form's mobile number (owner, 2026-11-04): required, and
 * while SMS codes are on, verified with a code before the account can be
 * created. "Verify" texts a code; once it's accepted the number is locked
 * (with "Change number") and a token that proves it goes with the form.
 */
export function RegisterPhoneField({
  smsOn,
  defaultValue,
  error,
  onReadyChange,
}: {
  smsOn: boolean;
  defaultValue?: string;
  /** The form's own message for this field (from the last submit). */
  error?: string;
  /** Whether the form may be submitted as far as the phone is concerned. */
  onReadyChange: (ready: boolean) => void;
}) {
  const [text, setText] = useState(defaultValue ?? "");
  const [step, setStep] = useState<Step>("enter");
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [phoneToken, setPhoneToken] = useState("");
  const [problem, setProblem] = useState<{ message: string; field?: string } | null>(null);
  const [resendIn, setResendIn] = useCountdown();
  const [pending, start] = useTransition();

  const ready = !smsOn || step === "verified";
  useEffect(() => onReadyChange(ready), [ready, onReadyChange]);

  function send() {
    setProblem(null);
    start(async () => {
      const result = await sendRegisterCodeAction(phone ?? text);
      if (!result.ok) return setProblem({ message: result.error, field: result.field });
      setPhone(result.phone);
      setCode("");
      setDevCode(result.devCode);
      setResendIn(result.resendInSeconds);
      setStep("code");
    });
  }

  function confirm(value = code) {
    if (!phone) return;
    setProblem(null);
    start(async () => {
      const result = await checkRegisterCodeAction(phone, value);
      if (!result.ok) return setProblem({ message: result.error, field: result.field });
      setPhoneToken(result.phoneToken);
      setDevCode(null);
      setStep("verified");
    });
  }

  function change() {
    setStep("enter");
    setPhone(null);
    setPhoneToken("");
    setCode("");
    setDevCode(null);
    setProblem(null);
  }

  // Enter in these boxes verifies; it must not submit the whole form.
  const onEnter = (action: () => void) => (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      action();
    }
  };

  const phoneError =
    (problem?.field === "phone" ? problem.message : undefined) ??
    (step === "enter" ? error : undefined);
  const codeError = problem?.field === "code" ? problem.message : undefined;
  const topError = problem && !problem.field ? problem.message : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
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
            readOnly={step !== "enter"}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={smsOn && step === "enter" ? onEnter(send) : undefined}
            error={phoneError}
            hint={
              step === "verified"
                ? undefined
                : smsOn
                  ? "We'll text you a code to verify it."
                  : undefined
            }
          />
        </div>
        {smsOn && step === "enter" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={send}
            loading={pending}
            disabled={!text.trim()}
            className="mt-[1.6rem] h-12 shrink-0 px-5"
          >
            Verify
          </Button>
        ) : null}
      </div>

      {step === "verified" ? (
        <p className="flex items-center justify-between gap-3 text-sm" role="status">
          <span className="inline-flex items-center gap-1.5 font-semibold text-sage-ink">
            <span aria-hidden>✓</span> Verified
          </span>
          <button
            type="button"
            onClick={change}
            className="font-semibold text-deep underline underline-offset-4 hover:text-gold-ink"
          >
            Change number
          </button>
        </p>
      ) : null}

      {step === "code" ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-sand/60 p-4">
          {topError ? (
            <p role="alert" className="text-sm font-medium text-red-700">
              {topError}
            </p>
          ) : null}
          {devCode ? (
            <TestCodeNotice
              code={devCode}
              onUse={(value) => {
                setCode(value);
                confirm(value);
              }}
            />
          ) : null}
          <div onKeyDown={onEnter(() => confirm())}>
            <CodeInput value={code} onChange={setCode} error={codeError} autoFocus />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              onClick={() => confirm()}
              loading={pending}
              disabled={code.length !== 6}
            >
              Confirm code
            </Button>
            <span className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={send}
                disabled={resendIn > 0 || pending}
                className="font-semibold text-deep underline-offset-4 hover:underline disabled:text-muted disabled:no-underline"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
              <button
                type="button"
                onClick={change}
                className="font-semibold text-deep underline-offset-4 hover:underline"
              >
                Change number
              </button>
            </span>
          </div>
        </div>
      ) : step === "enter" && topError ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {topError}
        </p>
      ) : null}

      <input type="hidden" name="phoneToken" value={phoneToken} />
    </div>
  );
}
