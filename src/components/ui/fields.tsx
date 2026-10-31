"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

/**
 * Form fields with a visible label, an optional hint and an error message,
 * all connected for screen readers (aria-describedby, aria-invalid).
 */

const control =
  "w-full rounded-lg border bg-sand px-4 text-deep shadow-sm placeholder:text-muted/70 transition-colors " +
  "focus-visible:border-deep focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-deep/40 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-deep">
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-gold">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  /** A short pill before the box (e.g. "+91" for an Indian mobile number). */
  addon?: ReactNode;
};

export function Input({
  label,
  hint,
  error,
  id,
  className,
  required,
  addon,
  ...props
}: InputProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} required={required}>
      {addon ? (
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-sand-deep px-3.5 text-xs font-semibold shadow-sm select-none"
          >
            {addon}
          </span>
          <input
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(inputId, hint, error)}
            className={cx(control, "h-12", error ? "border-red-600" : "border-line", className)}
            {...props}
          />
        </div>
      ) : (
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          className={cx(control, "h-12", error ? "border-red-600" : "border-line", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({
  label,
  hint,
  error,
  id,
  className,
  options,
  required,
  ...props
}: SelectProps) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <FieldShell id={selectId} label={label} hint={hint} error={error} required={required}>
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, hint, error)}
        className={cx(
          control,
          "h-12 appearance-none",
          error ? "border-red-600" : "border-line",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode };

export function Checkbox({ label, id, className, ...props }: CheckboxProps) {
  const generated = useId();
  const boxId = id ?? generated;
  return (
    <label
      htmlFor={boxId}
      className={cx("inline-flex cursor-pointer items-center gap-2.5 text-sm", className)}
    >
      <input
        id={boxId}
        type="checkbox"
        className="size-4 rounded border-deep/40 accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
