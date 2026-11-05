"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { FormError, IndiaFlag } from "@/components/auth/auth-forms";
import { CodeInput, TestCodeNotice, useCountdown } from "@/components/auth/code-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { localMobile } from "@/lib/account/rules";
import { sendPhoneChangeCodeAction, verifyPhoneChangeAction } from "@/lib/session/phone-actions";

/**
 * Adding or changing the number used to sign in (owner, 2026-11-04): a code
 * goes to the new number, and only then does it replace the old one.
 */
export function PhoneVerify({
  verifiedPhone,
  typedPhone,
}: {
  /** The current verified number, if any. */
  verifiedPhone: string | null;
  /** An unverified number from the profile, offered as the starting value. */
  typedPhone: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phoneText, setPhoneText] = useState(verifiedPhone ? "" : localMobile(typedPhone));
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [resendIn, setResendIn] = useCountdown();
  const [pending, start] = useTransition();
  const fieldError = (field: string) => (error?.field === field ? error.message : undefined);
  const topError = error && !error.field ? error.message : null;

  function send(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    start(async () => {
      const result = await sendPhoneChangeCodeAction(phone ?? phoneText);
      if (!result.ok) return setError({ message: result.error, field: result.field });
      setPhone(result.phone);
      setCode("");
      setDevCode(result.devCode);
      setResendIn(result.resendInSeconds);
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    if (!phone) return;
    setError(null);
    start(async () => {
      const result = await verifyPhoneChangeAction(phone, code);
      if (!result.ok) return setError({ message: result.error, field: result.field });
      setDone(result.phone);
      setOpen(false);
      setPhone(null);
      router.refresh();
    });
  }

  const current = done ?? verifiedPhone;
  return (
    <div className="flex flex-col gap-4">
      {done ? (
        <p role="status" className="rounded-2xl bg-mint-deep px-4 py-3 text-sm">
          Verified. You can now sign in with +91 {localMobile(done)}.
        </p>
      ) : null}
      <p className="text-sm text-muted">
        {current ? (
          <>
            You can sign in with a code sent to{" "}
            <strong className="text-deep">+91 {localMobile(current)}</strong>.
          </>
        ) : (
          "Add your mobile number to sign in with a code by SMS, no password needed."
        )}
      </p>

      {!open ? (
        <div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            {current ? "Change number" : "Add a mobile number"}
          </Button>
        </div>
      ) : phone === null ? (
        <form onSubmit={send} noValidate className="flex flex-col gap-4">
          <FormError message={topError} />
          <Input
            label={current ? "New mobile number" : "Mobile number"}
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
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending}>
              Send code
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="flex flex-col gap-4">
          <FormError message={topError} />
          <p className="text-sm text-muted" role="status">
            We sent a code to <strong className="text-deep">+91 {localMobile(phone)}</strong>.
          </p>
          {devCode ? <TestCodeNotice code={devCode} onUse={setCode} /> : null}
          <CodeInput value={code} onChange={setCode} error={fieldError("code")} autoFocus />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={pending} disabled={code.length !== 6}>
              Verify number
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPhone(null);
                setError(null);
              }}
            >
              Use another number
            </Button>
            {resendIn > 0 ? (
              <span className="text-sm text-muted">New code in {resendIn}s</span>
            ) : (
              <button
                type="button"
                onClick={() => send()}
                disabled={pending}
                className="text-sm font-semibold text-gold-ink underline-offset-4 hover:text-deep hover:underline disabled:opacity-60"
              >
                Send a new code
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
