"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { BagIcon } from "@/components/ui/icons";
import { cartFormAction } from "@/lib/cart/actions";
import {
  freeShipping,
  MAX_LINE_QUANTITY,
  priceChange,
  problemLines,
  type Cart,
  type CartLine,
} from "@/lib/cart/rules";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { useCart, useSeenPrices } from "./cart-context";

const itemsLabel = (count: number) => `${count} ${count === 1 ? "item" : "items"}`;

/** The header's bag: the count, opening the drawer (without JavaScript, a link to the cart page). */
export function CartButton() {
  const { count, openDrawer } = useCart();
  return (
    <Link
      href="/cart"
      onClick={(event) => {
        event.preventDefault();
        openDrawer();
      }}
      aria-label={`Bag, ${itemsLabel(count)}`}
      aria-haspopup="dialog"
      className="relative inline-flex rounded-full p-2 transition-colors hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep"
    >
      <BagIcon />
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] leading-5 font-semibold text-deep"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * One form per control (− / + / Remove), posting to the server, so the cart
 * page works without JavaScript. With JavaScript the shared cart handles it
 * and the page doesn't reload.
 */
function LineForm({
  line,
  op,
  quantity,
  label,
  disabled,
  className,
  children,
  onSubmit,
}: {
  line: CartLine;
  op: "set" | "remove";
  quantity?: number;
  label: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onSubmit: () => void;
}) {
  return (
    <form
      action={cartFormAction}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="lineId" value={line.id} />
      <input type="hidden" name="variantId" value={line.variantId} />
      {quantity !== undefined ? <input type="hidden" name="quantity" value={quantity} /> : null}
      <button type="submit" aria-label={label} disabled={disabled} className={className}>
        {children}
      </button>
    </form>
  );
}

const stepButton =
  "flex size-9 items-center justify-center rounded-full text-lg leading-none hover:bg-deep/5 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-deep";

function Line({ line, roomy }: { line: CartLine; roomy?: boolean }) {
  const { setQuantity, remove, pending } = useCart();
  const seen = useSeenPrices();
  const changed = priceChange(line, seen);
  const problem = line.availability !== "available";
  const href = `/product/${encodeURIComponent(line.productSlug)}?variant=${encodeURIComponent(line.sku)}`;
  return (
    <li
      className={cx(
        "flex gap-4 rounded-3xl bg-white p-4 ring-1",
        problem ? "ring-red-300" : "ring-deep/5",
      )}
    >
      <Link
        href={href}
        className={cx(
          "relative shrink-0 overflow-hidden rounded-2xl bg-mint-deep",
          roomy ? "size-28" : "size-20",
        )}
        tabIndex={-1}
        aria-hidden
      >
        {line.image ? (
          <Image src={line.image.thumbnail} alt="" fill sizes="112px" className="object-cover" />
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} className="font-display text-lg leading-snug hover:underline">
              {line.productName}
            </Link>
            <p className="text-sm text-deep/70">{line.variantLabel}</p>
          </div>
          <p className="shrink-0 text-right text-sm">
            <span className="font-semibold">{formatPrice(line.lineTotal)}</span>
            {line.quantity > 1 ? (
              <span className="block text-xs text-deep/70">{formatPrice(line.unitPrice)} each</span>
            ) : null}
            {line.onSale && line.listPrice !== line.unitPrice ? (
              <s className="block text-xs text-deep/70">
                <span className="sr-only">was </span>
                {formatPrice(line.listPrice)}
              </s>
            ) : null}
          </p>
        </div>
        {problem && line.message ? (
          <p className="text-sm font-medium text-red-800">{line.message}</p>
        ) : null}
        {changed ? (
          <p className="text-sm text-deep/70">
            Price changed from {formatPrice(changed.from)} to {formatPrice(changed.to)}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div
            role="group"
            aria-label={`Quantity of ${line.productName}`}
            className="flex items-center rounded-full border border-deep/15"
          >
            {line.quantity > 1 ? (
              <LineForm
                line={line}
                op="set"
                quantity={line.quantity - 1}
                label={`One fewer ${line.productName}`}
                disabled={pending}
                className={stepButton}
                onSubmit={() => setQuantity(line, line.quantity - 1)}
              >
                −
              </LineForm>
            ) : (
              <LineForm
                line={line}
                op="remove"
                label={`Remove ${line.productName}`}
                disabled={pending}
                className={stepButton}
                onSubmit={() => remove(line)}
              >
                −
              </LineForm>
            )}
            <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">
              <span className="sr-only">Quantity </span>
              {line.quantity}
            </span>
            <LineForm
              line={line}
              op="set"
              quantity={line.quantity + 1}
              label={`One more ${line.productName}`}
              disabled={
                pending || line.quantity >= MAX_LINE_QUANTITY || line.availability === "unavailable"
              }
              className={stepButton}
              onSubmit={() => setQuantity(line, line.quantity + 1)}
            >
              +
            </LineForm>
          </div>
          <LineForm
            line={line}
            op="remove"
            label={`Remove ${line.productName} from your bag`}
            disabled={pending}
            className="text-sm text-deep/70 underline-offset-4 hover:text-deep hover:underline disabled:opacity-40"
            onSubmit={() => remove(line)}
          >
            Remove
          </LineForm>
        </div>
      </div>
    </li>
  );
}

export function CartLines({ cart, roomy }: { cart: Cart; roomy?: boolean }) {
  const problems = problemLines(cart);
  return (
    <>
      {problems.length > 0 ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {problems.length === 1 ? "1 item needs" : `${problems.length} items need`} your attention
          before checkout.
        </p>
      ) : null}
      <ul className="flex flex-col gap-3" aria-label="Items in your bag">
        {cart.lines.map((line) => (
          <Line key={line.id} line={line} roomy={roomy} />
        ))}
      </ul>
    </>
  );
}

export function FreeShippingLine({ cart }: { cart: Cart }) {
  const { freeShippingThreshold } = useCart();
  const status = freeShipping(cart.subtotal, freeShippingThreshold);
  if (!status) return null;
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm">
      <p>
        {status.reached ? (
          <>You&apos;ve got free shipping.</>
        ) : (
          <>
            Add <strong>{formatPrice(status.remaining)}</strong> more for free shipping.
          </>
        )}
      </p>
      <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-deep/10">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-500"
          style={{ width: `${status.reached ? 100 : status.percent}%` }}
        />
      </div>
    </div>
  );
}

/** Checkout (signing in first, for guests): held while an item needs attention. */
export function CheckoutButton({ cart }: { cart: Cart }) {
  const { closeDrawer } = useCart();
  if (!cart.readyForCheckout || cart.lines.length === 0)
    return (
      <div>
        <Button className="w-full" size="lg" disabled aria-describedby="checkout-note">
          Checkout
        </Button>
        <p id="checkout-note" className="mt-2 text-center text-xs text-deep/70">
          Fix the items marked above to continue.
        </p>
      </div>
    );
  return (
    <ButtonLink href="/checkout" size="lg" className="w-full" onClick={closeDrawer}>
      Checkout
    </ButtonLink>
  );
}

export function EmptyBag({ onShop }: { onShop?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="font-display text-3xl">Your bag is empty</p>
      <p className="text-deep/70">Find your length, colour and texture in the shop.</p>
      <ButtonLink href="/shop" onClick={onShop}>
        Shop all
      </ButtonLink>
    </div>
  );
}

/** The bag, sliding in from the right (full width on phones). */
export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, pending, error } = useCart();
  return (
    <Dialog
      open={drawerOpen}
      onClose={closeDrawer}
      title={cart ? `Your bag (${cart.itemCount})` : "Your bag"}
      placement="right"
      className="sm:w-[min(28rem,92vw)]"
    >
      <div className="flex min-h-full flex-col gap-4" aria-busy={pending || undefined}>
        {error ? (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {cart === null ? (
          <p className="py-10 text-center text-deep/70">Loading your bag…</p>
        ) : cart.lines.length === 0 ? (
          <EmptyBag onShop={closeDrawer} />
        ) : (
          <div className={cx("flex flex-col gap-4 transition-opacity", pending && "opacity-60")}>
            <FreeShippingLine cart={cart} />
            <CartLines cart={cart} />
            <div className="sticky bottom-0 -mx-6 mt-auto flex flex-col gap-3 border-t border-deep/10 bg-mint px-6 pt-4 pb-2">
              <p className="flex items-baseline justify-between">
                <span>Subtotal</span>
                <span className="text-lg font-semibold">{formatPrice(cart.subtotal)}</span>
              </p>
              <p className="-mt-2 text-xs text-deep/70">
                Shipping and taxes are worked out at checkout.
              </p>
              <ButtonLink href="/cart" variant="secondary" onClick={closeDrawer}>
                View bag
              </ButtonLink>
              <CheckoutButton cart={cart} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/**
 * Add to bag on the product page, with a quantity (1–10). A real form, so it
 * works without JavaScript (it then goes to the cart page); with JavaScript
 * the drawer opens instead. Sold-out options can't be added.
 */
export function AddToBag({
  variantId,
  price,
  inStock,
  onAdded,
}: {
  variantId: string;
  price: string;
  inStock: boolean;
  /** Called after it went in the bag. */
  onAdded?: () => void;
}) {
  const { add, pending } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [problem, setProblem] = useState<string | null>(null);
  // A different option starts again from one, without old problems.
  const [shownFor, setShownFor] = useState(variantId);
  if (shownFor !== variantId) {
    setShownFor(variantId);
    setQuantity(1);
    setProblem(null);
  }

  if (!inStock)
    return (
      <Button className="mt-8 w-full" size="lg" disabled>
        Sold out
      </Button>
    );

  return (
    <form
      action={cartFormAction}
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await add(variantId, quantity, price);
        setProblem(result);
        if (result === null) onAdded?.();
      }}
      className="mt-8 flex flex-col gap-3"
    >
      <input type="hidden" name="op" value="add" />
      <input type="hidden" name="variantId" value={variantId} />
      <div className="flex gap-3">
        <div
          role="group"
          aria-label="Quantity"
          className="flex h-13 items-center rounded-full border border-deep/20 bg-white/70"
        >
          <button
            type="button"
            aria-label="One fewer"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className={stepButton}
          >
            −
          </button>
          <input
            name="quantity"
            aria-label="Quantity"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value.replace(/\D/g, ""));
              setQuantity(Math.min(MAX_LINE_QUANTITY, Math.max(1, next || 1)));
            }}
            className="w-8 bg-transparent text-center font-medium focus:outline-none"
          />
          <button
            type="button"
            aria-label="One more"
            disabled={quantity >= MAX_LINE_QUANTITY}
            onClick={() => setQuantity((q) => Math.min(MAX_LINE_QUANTITY, q + 1))}
            className={stepButton}
          >
            +
          </button>
        </div>
        <Button type="submit" size="lg" loading={pending} className="flex-1">
          Add to bag
        </Button>
      </div>
      {problem ? (
        <p role="alert" className="text-sm font-medium text-red-800">
          {problem}
        </p>
      ) : null}
    </form>
  );
}
