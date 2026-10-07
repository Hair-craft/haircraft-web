"use client";

import Form from "next/form";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * A choice on the checkout page (address, payment): a plain GET form to
 * /checkout, so it works without JavaScript (with its button); with
 * JavaScript, choosing is enough and the page updates without a reload.
 */
export function ChoiceForm({
  label,
  button,
  hidden,
  children,
}: {
  label: string;
  /** The button's text, shown only without JavaScript. */
  button: string;
  /** The other choices to keep. */
  hidden: Record<string, string | null>;
  children: ReactNode;
}) {
  return (
    <Form
      action="/checkout"
      scroll={false}
      replace
      aria-label={label}
      onChange={(event) => event.currentTarget.requestSubmit()}
    >
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      {children}
      <noscript>
        <Button type="submit" variant="secondary" size="sm" className="mt-4">
          {button}
        </Button>
      </noscript>
    </Form>
  );
}

/** Place order: shows that it's working and can't be pressed twice. */
export function PlaceOrderButton({
  disabled,
  children,
}: {
  disabled: boolean;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled} loading={pending}>
      {pending ? "Placing your order…" : children}
    </Button>
  );
}
