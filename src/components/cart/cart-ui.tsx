"use client";

import Image from "next/image";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { BagIcon, LockIcon } from "@/components/ui/icons";
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
import { returnRules } from "@/content/returns-rules";
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
          className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-deep text-[0.625rem] font-bold text-white"
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

/** A price (decimal rupees) times a quantity, in whole paise (never floats on money). */
function timesQuantity(price: string, quantity: number): string {
  const [rupees, paise = ""] = price.split(".");
  const total = (Number(rupees) * 100 + Number(paise.padEnd(2, "0").slice(0, 2))) * quantity;
  return `${Math.floor(total / 100)}.${String(total % 100).padStart(2, "0")}`;
}

const stepButton =
  "flex size-9 items-center justify-center rounded-full text-lg leading-none hover:bg-deep/5 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-deep";

function BinIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

function Line({ line, roomy }: { line: CartLine; roomy?: boolean }) {
  const { setQuantity, remove, pending } = useCart();
  const seen = useSeenPrices();
  const changed = priceChange(line, seen);
  const problem = line.availability !== "available";
  const href = `/product/${encodeURIComponent(line.productSlug)}?variant=${encodeURIComponent(line.sku)}`;
  return (
    <li
      className={cx(
        "flex gap-3.5 rounded-xl border bg-sand p-3.5",
        problem ? "border-red-300" : "border-line",
      )}
    >
      <Link
        href={href}
        className={cx(
          "relative shrink-0 overflow-hidden rounded-lg bg-white shadow-inner",
          roomy ? "size-28" : "size-20",
        )}
        tabIndex={-1}
        aria-hidden
      >
        {line.image ? (
          <Image src={line.image.thumbnail} alt="" fill sizes="112px" className="object-cover" />
        ) : (
          <PhotoPlaceholder size="small" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={href}
              className={cx(
                "leading-snug font-bold hover:underline",
                roomy ? "font-display text-lg" : "line-clamp-2 text-xs tracking-wide",
              )}
            >
              {line.productName}
            </Link>
            <p className="mt-0.5 text-xs text-muted">{line.variantLabel}</p>
          </div>
          <p className="shrink-0 text-right text-sm">
            <span className="text-base font-bold tracking-tight">
              {formatPrice(line.lineTotal)}
            </span>
            {line.quantity > 1 ? (
              <span className="block text-xs text-muted">{formatPrice(line.unitPrice)} each</span>
            ) : null}
            {line.onSale && line.listPrice !== line.unitPrice ? (
              <s className="block text-xs text-muted">
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
          <p className="text-sm text-muted">
            Price changed from {formatPrice(changed.from)} to {formatPrice(changed.to)}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div
            role="group"
            aria-label={`Quantity of ${line.productName}`}
            className="flex items-center rounded-full border border-line bg-white"
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
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:text-[#ba1a1a] disabled:opacity-40"
            onSubmit={() => remove(line)}
          >
            <BinIcon />
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
    <div className="rounded-lg border border-line bg-white p-3 text-xs">
      <p className="flex items-center justify-between gap-3 font-semibold">
        <span className="text-sage-ink">
          <span aria-hidden className="text-gold">
            ✦{" "}
          </span>
          {status.reached ? (
            <>You&apos;ve got free shipping.</>
          ) : (
            <>
              Add <strong>{formatPrice(status.remaining)}</strong> more for free shipping.
            </>
          )}
        </span>
        <span className="font-bold text-deep">{formatPrice(cart.subtotal)}</span>
      </p>
      <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eee7dc]">
        <div
          className="h-full rounded-full bg-deep transition-[width] duration-500"
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
          <LockIcon width={18} height={18} />
          Secure checkout
        </Button>
        <p id="checkout-note" className="mt-2 text-center text-xs text-muted">
          Fix the items marked above to continue.
        </p>
      </div>
    );
  return (
    <ButtonLink href="/checkout" size="lg" className="w-full text-sm" onClick={closeDrawer}>
      <LockIcon width={18} height={18} />
      Secure checkout · {formatPrice(cart.subtotal)}
    </ButtonLink>
  );
}

export function EmptyBag({ onShop }: { onShop?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="font-display text-3xl">Your bag is empty</p>
      <p className="text-muted">Find your length, colour and texture in the shop.</p>
      <ButtonLink href="/shop" onClick={onShop}>
        Shop all
      </ButtonLink>
    </div>
  );
}

/** The bag, sliding in from the right (full width on phones). */
export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, pending, error, freeShippingThreshold } = useCart();
  const free = cart ? freeShipping(cart.subtotal, freeShippingThreshold) : null;
  const filled = cart !== null && cart.lines.length > 0;
  return (
    <Dialog
      open={drawerOpen}
      onClose={closeDrawer}
      title={cart ? `Your bag (${cart.itemCount})` : "Your bag"}
      placement="right"
      surface="white"
      className="border-l border-line sm:w-[min(460px,92vw)]"
      header={
        <>
          <div className="flex items-center gap-2.5 pr-12">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-deep text-white"
            >
              <BagIcon width={20} height={20} />
            </span>
            <div>
              <h2 className="font-display text-lg leading-6 font-bold">Your bag</h2>
              <p className="text-[0.625rem] font-bold tracking-[0.08em] text-muted uppercase">
                {cart === null
                  ? "Loading…"
                  : `${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`}
              </p>
            </div>
          </div>
          {filled ? (
            <div className="mt-4">
              <FreeShippingLine cart={cart} />
            </div>
          ) : null}
        </>
      }
      footer={
        filled ? (
          <div className="flex flex-col gap-3.5 border-t border-line bg-white p-5 shadow-[0_-4px_20px_rgba(11,41,26,0.04)]">
            <div className="flex flex-col gap-1.5 text-[0.8125rem]">
              <p className="flex justify-between text-muted">
                <span>
                  Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
                </span>
                <span>{formatPrice(cart.subtotal)}</span>
              </p>
              <p className="flex justify-between text-muted">
                <span>Delivery</span>
                {free?.reached ? (
                  <span className="font-semibold text-sage-ink">FREE</span>
                ) : (
                  <span>Worked out at checkout</span>
                )}
              </p>
              <p className="flex items-baseline justify-between border-t border-line pt-2">
                <span className="font-display text-lg font-bold">Total</span>
                <span className="text-right">
                  <span className="font-display text-lg font-bold">
                    {formatPrice(cart.subtotal)}
                  </span>
                  <span className="block text-[0.6875rem] text-muted">
                    Inclusive of all GST taxes
                    {free?.reached ? "" : ", before delivery"}
                  </span>
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <CheckoutButton cart={cart} />
              <ButtonLink
                href="/cart"
                variant="ghost"
                onClick={closeDrawer}
                className="w-full border border-line bg-sand hover:bg-sand-deep"
              >
                View bag
              </ButtonLink>
            </div>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[0.6875rem] text-muted">
              <span>✦ Exchange for defective items</span>
              <span aria-hidden>•</span>
              <span>Secure payments</span>
              <span aria-hidden>•</span>
              <span>Ships in {returnRules.dispatchWorkingDays} working days</span>
            </p>
          </div>
        ) : null
      }
    >
      <div className="flex min-h-full flex-col gap-4" aria-busy={pending || undefined}>
        {error ? (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {cart === null ? (
          <p className="py-10 text-center text-muted">Loading your bag…</p>
        ) : cart.lines.length === 0 ? (
          <EmptyBag onShop={closeDrawer} />
        ) : (
          <div className={cx("flex flex-col gap-4 transition-opacity", pending && "opacity-60")}>
            <CartLines cart={cart} />
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
          className="flex h-12 items-center rounded-full bg-sand-deep px-1.5"
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
        <Button
          type="submit"
          size="lg"
          loading={pending}
          aria-label="Add to bag"
          className="h-12 flex-1 text-sm tracking-wider uppercase"
        >
          <BagIcon width={20} height={20} />
          Add to Bag — {formatPrice(timesQuantity(price, quantity))}
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
