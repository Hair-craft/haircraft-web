"use client";

import { useActionState } from "react";
import { FormError } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";
import { cancelOrderAction, type CancelState } from "@/lib/orders/actions";
import { CANCEL_REASONS } from "@/lib/orders/rules";

const EMPTY: CancelState = { error: null };

/**
 * "Cancel this order": a quiet link that opens a short form (a reason, and
 * the button). A plain form inside <details>, so it works without JavaScript.
 */
export function CancelOrder({ orderNumber, paid }: { orderNumber: string; paid: boolean }) {
  const [state, action, pending] = useActionState(cancelOrderAction, EMPTY);
  return (
    <details
      className="group rounded-[2rem] bg-white/60 p-5 ring-1 ring-deep/5"
      open={Boolean(state.error)}
    >
      <summary className="cursor-pointer list-none text-sm text-deep/70 underline-offset-4 hover:text-deep hover:underline">
        Cancel this order
      </summary>
      {/* Keyed by what was sent: React resets a form after its action and ignores new defaults, so it starts afresh with the shopper's choices. */}
      <form
        key={`${state.reason ?? ""}|${state.details ?? ""}`}
        action={action}
        className="mt-4 flex flex-col gap-4"
      >
        <input type="hidden" name="orderNumber" value={orderNumber} />
        <FormError message={state.error} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Why are you cancelling?</legend>
          {CANCEL_REASONS.map((reason, i) => (
            <label key={reason} className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name="reason"
                value={reason}
                defaultChecked={state.reason ? state.reason === reason : i === 0}
                className="size-4 accent-deep"
              />
              {reason}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`details-${orderNumber}`} className="text-sm text-deep/70">
            Anything to add? (needed for Other)
          </label>
          <textarea
            id={`details-${orderNumber}`}
            name="details"
            rows={2}
            maxLength={400}
            defaultValue={state.details ?? ""}
            className="w-full rounded-xl border border-deep/20 bg-white/80 px-4 py-2.5 focus-visible:border-deep focus-visible:outline-2 focus-visible:outline-deep/40"
          />
        </div>
        <p className="text-sm text-deep/70">
          {paid
            ? "Your payment will be refunded to the method you paid with, usually within 5–7 working days."
            : "Nothing has been charged, so there's nothing to refund."}
        </p>
        <div>
          <Button type="submit" variant="secondary" loading={pending}>
            Cancel order
          </Button>
        </div>
      </form>
    </details>
  );
}
