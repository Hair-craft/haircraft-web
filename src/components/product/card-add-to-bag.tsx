"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/cart-context";
import { BagIcon } from "@/components/ui/icons";
import { cartFormAction } from "@/lib/cart/actions";
import { cx } from "@/lib/cx";

/**
 * "Add to bag" on a product card whose product has nothing to choose (one
 * variant; owner, 2026-11-13): adds one and opens the bag drawer. Without
 * JavaScript the form posts to the server and goes to the cart page.
 */
export function CardAddToBag({
  variantId,
  price,
  inStock,
  name,
}: {
  variantId: string;
  /** Its price as shown on the card (the bag notes a later change). */
  price: string;
  inStock: boolean;
  name: string;
}) {
  const { add, pending } = useCart();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const button =
    "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";

  if (!inStock)
    return (
      <button
        type="button"
        disabled
        className={cx(button, "mt-3 cursor-not-allowed bg-sand text-muted")}
      >
        Sold out
      </button>
    );

  return (
    <form
      action={cartFormAction}
      onSubmit={async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setProblem(await add(variantId, 1, price));
        setBusy(false);
      }}
      className="mt-3 flex flex-col gap-1.5"
    >
      <input type="hidden" name="op" value="add" />
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        disabled={pending || busy}
        aria-label={`Add ${name} to bag`}
        className={cx(
          button,
          "bg-deep text-white hover:bg-deep-hover disabled:cursor-wait disabled:opacity-70",
        )}
      >
        <BagIcon width={16} height={16} />
        {busy ? "Adding…" : "Add to bag"}
      </button>
      {problem ? (
        <p role="alert" className="text-xs font-medium text-red-800">
          {problem}
        </p>
      ) : null}
    </form>
  );
}
