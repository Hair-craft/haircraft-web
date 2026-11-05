"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/fields";

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
      className="hc-keep-size text-center font-mono text-xl tracking-[0.5em]"
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
