"use client";

import Link from "next/link";
import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import type { Cart } from "@/lib/cart/rules";
import { useCart } from "./cart-context";
import { CartLines, CheckoutButton, EmptyBag, FreeShippingLine } from "./cart-ui";

/**
 * The cart page's contents. The server sends the bag as it is; from then on
 * the shared cart (also used by the drawer) keeps it up to date.
 */
export function CartPageView({ initial, problem }: { initial: Cart; problem: string | null }) {
  const { cart: shared, adopt, error, pending } = useCart();
  useEffect(() => adopt(initial), [initial, adopt]);
  const cart = shared ?? initial;
  const message = error ?? problem;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {message ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </p>
      ) : null}
      {cart.lines.length === 0 ? (
        <EmptyBag />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className={`flex flex-col gap-4 transition-opacity ${pending ? "opacity-60" : ""}`}>
            <CartLines cart={cart} roomy />
          </div>
          <aside
            aria-label="Order summary"
            className="flex flex-col gap-4 rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5 lg:sticky lg:top-28"
          >
            <h2 className="font-display text-2xl">Summary</h2>
            <p className="flex items-baseline justify-between">
              <span>
                Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
              </span>
              <span className="text-lg font-semibold">{formatPrice(cart.subtotal)}</span>
            </p>
            <p className="-mt-2 text-xs text-deep/70">
              Shipping and taxes are worked out at checkout.
            </p>
            <FreeShippingLine cart={cart} />
            <CheckoutButton cart={cart} />
            <p className="text-center text-xs text-deep/70">
              <Link href="/shipping" className="underline underline-offset-2 hover:text-deep">
                Delivery
              </Link>{" "}
              ·{" "}
              <Link href="/returns" className="underline underline-offset-2 hover:text-deep">
                Returns &amp; refunds
              </Link>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
