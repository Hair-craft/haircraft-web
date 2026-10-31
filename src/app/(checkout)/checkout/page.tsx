import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AddressForm } from "@/components/account/account-forms";
import { AddressText } from "@/components/account/account-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { ChoiceForm, PlaceOrderButton } from "@/components/checkout/checkout-client";
import {
  CheckoutSection,
  SummaryLines,
  TotalsList,
  type SummaryLine,
} from "@/components/checkout/checkout-parts";
import { Badge } from "@/components/ui/display";
import { ChevronDownIcon } from "@/components/ui/icons";
import { getAddresses } from "@/lib/account/api";
import { loadForAccount } from "@/lib/account/server";
import { previewCheckout } from "@/lib/checkout/api";
import { placeOrderAction } from "@/lib/checkout/actions";
import {
  bagProblems,
  checkoutHref,
  checkoutNotice,
  chosenAddress,
  idempotencyKey,
  readCheckoutState,
} from "@/lib/checkout/rules";
import { business } from "@/content/business";
import { returnRules } from "@/content/returns-rules";
import { cx } from "@/lib/cx";
import { whatsappChatHref } from "@/lib/info/contact";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

const radioCard =
  "flex cursor-pointer gap-3 rounded-xl border border-transparent bg-sand p-4 transition-colors hover:bg-sand-deep has-checked:border-deep/30 has-checked:bg-sage/50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-deep";

/** Bag ✓ → Delivery and payment → Confirmation. */
function Steps() {
  const steps = ["Bag", "Delivery & payment", "Confirmation"];
  return (
    <ol
      aria-label="Checkout steps"
      className="flex items-center gap-2 overflow-x-auto pb-1 md:gap-4"
    >
      {steps.map((step, i) => (
        <li key={step} className="flex shrink-0 items-center gap-2 md:gap-4">
          {i > 0 ? (
            <span aria-hidden className={cx("h-0.5 w-6", i === 1 ? "bg-sage" : "bg-[#eee7dc]")} />
          ) : null}
          <span className="flex items-center gap-2" aria-current={i === 1 ? "step" : undefined}>
            <span
              aria-hidden
              className={cx(
                "flex size-7 items-center justify-center rounded-full text-[0.625rem] font-bold",
                i === 0
                  ? "bg-sage text-sage-ink"
                  : i === 1
                    ? "bg-deep text-white shadow-sm"
                    : "bg-[#eee7dc]",
              )}
            >
              {i === 0 ? "✓" : i + 1}
            </span>
            <span
              className={cx(
                "text-xs",
                i === 1 ? "font-bold" : "font-medium",
                i === 2 && "text-muted",
              )}
            >
              {i + 1}. {step}
              {i === 0 ? <span className="sr-only"> (done)</span> : null}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
const radio = "mt-1 size-4 shrink-0 accent-deep";

/** `/checkout`: address, payment and the order summary on one page. */
export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;
  const state = readCheckoutState(params);
  const here = checkoutHref(state);

  const data = await loadForAccount(here, async (token) => {
    const addresses = await getAddresses(token);
    const address = chosenAddress(addresses, state.address);
    const preview = await previewCheckout(token, {
      addressId: address?.id ?? null,
      couponCode: state.coupon,
      paymentMethod: state.pay,
    });
    return { addresses, address, preview };
  });
  if (!data) return <ApiUnavailable retryHref={here} />;
  const { addresses, address, preview } = data;
  if (preview.lines.length === 0) redirect("/cart");

  const chosen = { ...state, address: address?.id ?? null };
  const notice = checkoutNotice(params.notice);
  const lineProblems = bagProblems(preview);
  const codProblem = preview.problems.find((p) => p.code === "COD_NOT_AVAILABLE");
  const coupon = preview.coupon;
  const keep = {
    address: chosen.address,
    coupon: chosen.coupon,
    pay: chosen.pay === "COD" ? "cod" : null,
  };
  const lines: SummaryLine[] = preview.lines.map((line) => ({
    key: line.id,
    name: line.productName,
    slug: line.productSlug,
    option: line.variantLabel,
    image: line.image?.thumbnail ?? null,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
    problem: line.availability === "available" ? null : line.message,
  }));
  const itemCount = preview.lines.reduce((sum, line) => sum + line.quantity, 0);
  // The bag, the address and the payment method must be right; a coupon that
  // doesn't apply is simply left off (it changes nothing in the total).
  const canPlace = preview.problems.length === 0 && address !== null;
  const whatsapp = whatsappChatHref(business);

  const summary = (
    <>
      <SummaryLines lines={lines} />
      {lineProblems.length > 0 ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {lineProblems.length === 1 ? "1 item needs" : `${lineProblems.length} items need`} your
          attention.{" "}
          <Link href="/cart" className="font-medium underline underline-offset-4">
            Review your bag
          </Link>
        </p>
      ) : null}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col justify-between gap-4 py-2 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-2xl font-semibold sm:text-[2rem] sm:leading-10">
            Checkout
          </h1>
          <Steps />
        </div>
        <p className="flex items-center gap-2 self-start rounded-full bg-white/80 px-3.5 py-1.5 text-[0.625rem] font-bold tracking-wider uppercase shadow-sm lg:self-auto">
          <span aria-hidden className="text-gold">
            ✦
          </span>
          Secure payments by Razorpay · 100% human hair
        </p>
      </div>
      {notice ? (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-gold/40 bg-gold/15 px-4 py-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* On phones the summary comes first, folded to its total. */}
        <details className="group rounded-xl bg-white p-5 shadow-sm lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm">
              Order summary ({itemCount} {itemCount === 1 ? "item" : "items"})
              <ChevronDownIcon
                width={16}
                height={16}
                className="transition-transform group-open:rotate-180"
              />
            </span>
            <span className="font-semibold">{formatPrice(preview.totals.grandTotal)}</span>
          </summary>
          <div className="mt-5 flex flex-col gap-4">{summary}</div>
        </details>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <CheckoutSection number={1} title="Delivery address">
            {addresses.length === 0 ? (
              <AddressForm
                isFirst
                pick
                back={checkoutHref({ ...chosen, address: null })}
                here={here}
              />
            ) : (
              <>
                <ChoiceForm
                  label="Delivery address"
                  button="Deliver here"
                  hidden={{ ...keep, address: null }}
                >
                  <fieldset>
                    <legend className="sr-only">Choose where to deliver</legend>
                    <ul className="grid gap-3 md:grid-cols-2">
                      {addresses.map((a) => (
                        <li key={a.id}>
                          <label className={cx(radioCard, "h-full")}>
                            <input
                              type="radio"
                              name="address"
                              value={a.id}
                              defaultChecked={a.id === address?.id}
                              className={radio}
                            />
                            <span className="min-w-0 text-sm">
                              <span className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="font-medium">{a.label ?? "Address"}</span>
                                {a.isDefault ? <Badge tone="gold">Default</Badge> : null}
                              </span>
                              <AddressText address={a} />
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                </ChoiceForm>
                <Link
                  href={`/checkout/address${here.slice("/checkout".length)}`}
                  className="mt-4 inline-block text-xs font-bold tracking-wide uppercase underline-offset-4 hover:underline"
                >
                  + Add a new address
                </Link>
              </>
            )}
          </CheckoutSection>

          <CheckoutSection number={2} title="Payment">
            <ChoiceForm label="Payment method" button="Use this" hidden={{ ...keep, pay: null }}>
              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">Choose how to pay</legend>
                <label className={radioCard}>
                  <input
                    type="radio"
                    name="pay"
                    value="online"
                    defaultChecked={chosen.pay === "ONLINE"}
                    className={radio}
                  />
                  <span className="flex flex-1 flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      <span className="block font-semibold">Pay online</span>
                      <span className="text-muted">
                        UPI (GPay, PhonePe, Paytm…), cards, net banking and wallets
                      </span>
                    </span>
                    <span aria-hidden className="flex gap-1.5">
                      {["UPI", "Cards", "NetBanking"].map((method) => (
                        <span
                          key={method}
                          className="rounded bg-white px-1.5 py-0.5 text-[0.625rem] font-bold"
                        >
                          {method}
                        </span>
                      ))}
                    </span>
                  </span>
                </label>
                {preview.paymentMethods.cod || chosen.pay === "COD" ? (
                  <label className={radioCard}>
                    <input
                      type="radio"
                      name="pay"
                      value="cod"
                      defaultChecked={chosen.pay === "COD"}
                      className={radio}
                    />
                    <span className="text-sm">
                      <span className="block font-semibold">Cash on delivery</span>
                      <span className="text-muted">Pay the courier in cash or by UPI</span>
                      {codProblem ? (
                        <span className="mt-1 block text-red-800">{codProblem.message}</span>
                      ) : null}
                    </span>
                  </label>
                ) : null}
              </fieldset>
            </ChoiceForm>
          </CheckoutSection>

          <div className="flex items-start gap-4 rounded-xl bg-gradient-to-br from-sage/80 to-cream p-5 shadow-sm">
            <span
              aria-hidden
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-gold shadow-sm"
            >
              ✦
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="font-display text-lg font-semibold">Checked before it ships</span>
              <span className="text-sm leading-relaxed text-[#424843]">
                Every piece is checked before dispatch. If something arrives defective or isn&apos;t
                what you ordered, it can be exchanged within {returnRules.exchangeDays} days of
                delivery, as long as it is unused.{" "}
                <PolicyLink href="/returns">Read the exchange policy</PolicyLink>
              </span>
            </span>
          </div>

          <CheckoutSection number={3} title="Delivery instructions">
            <label htmlFor="notes" className="text-sm text-muted">
              Anything the courier should know (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              form="place-order"
              maxLength={500}
              rows={3}
              placeholder="For example: please call before delivering."
              className="mt-2 w-full rounded-lg border border-line bg-sand px-4 py-3 text-deep shadow-sm placeholder:text-muted/70 focus-visible:border-deep focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-deep/40"
            />
          </CheckoutSection>
        </div>

        <aside
          aria-label="Order summary"
          className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-md lg:sticky lg:top-8 lg:col-span-5"
        >
          <div className="hidden items-center justify-between lg:flex">
            <span className="flex flex-col">
              <span className="text-[0.625rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
                Your order
              </span>
              <h2 className="font-display text-xl font-medium">Order summary</h2>
              <span className="text-xs text-muted">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </span>
            <span className="rounded-full bg-sage px-2.5 py-1 text-[0.625rem] font-semibold text-sage-ink">
              100% human hair
            </span>
          </div>
          <div className="hidden flex-col gap-4 lg:flex">{summary}</div>

          <Form action="/checkout" scroll={false} replace className="flex flex-col gap-2">
            {keep.address ? <input type="hidden" name="address" value={keep.address} /> : null}
            {keep.pay ? <input type="hidden" name="pay" value={keep.pay} /> : null}
            {coupon?.applied ? (
              <p className="flex items-center justify-between gap-3 rounded-xl bg-sand p-3 text-sm text-sage-ink">
                <span>
                  <strong>{coupon.code}</strong> applied: you save {formatPrice(coupon.discount)}.
                </span>
                <Link
                  href={checkoutHref({ ...chosen, coupon: null })}
                  replace
                  scroll={false}
                  className="font-medium underline underline-offset-4"
                >
                  Remove
                </Link>
              </p>
            ) : (
              <details className="group rounded-xl bg-sand p-3" open={Boolean(coupon)}>
                <summary className="cursor-pointer list-none text-sm font-semibold underline-offset-4 hover:underline">
                  <span aria-hidden className="mr-1.5 text-gold">
                    ✦
                  </span>
                  Have a coupon?
                </summary>
                <div className="mt-3 flex gap-2">
                  <label htmlFor="coupon" className="sr-only">
                    Coupon code
                  </label>
                  <input
                    id="coupon"
                    name="coupon"
                    defaultValue={coupon?.code ?? ""}
                    maxLength={30}
                    autoComplete="off"
                    aria-invalid={coupon && !coupon.applied ? true : undefined}
                    aria-describedby={coupon && !coupon.applied ? "coupon-error" : undefined}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-sand px-4 uppercase shadow-sm focus-visible:border-deep focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-deep/40"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-deep px-5 text-sm font-semibold text-white hover:bg-deep-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
                  >
                    Apply
                  </button>
                </div>
                {coupon && !coupon.applied ? (
                  <p id="coupon-error" role="alert" className="mt-2 text-sm text-red-800">
                    {coupon.message ?? "This coupon can't be used for this order."}
                  </p>
                ) : null}
              </details>
            )}
          </Form>

          <TotalsList totals={preview.totals} couponCode={coupon?.applied ? coupon.code : null} />
          {preview.amountToFreeShipping ? (
            <p className="rounded-xl bg-mint px-4 py-3 text-sm">
              Add <strong>{formatPrice(preview.amountToFreeShipping)}</strong> more for free
              shipping.
            </p>
          ) : null}

          <form id="place-order" action={placeOrderAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value={idempotencyKey(crypto.randomUUID())} />
            <input type="hidden" name="address" value={address?.id ?? ""} />
            {coupon?.applied ? <input type="hidden" name="coupon" value={coupon.code} /> : null}
            <input type="hidden" name="pay" value={chosen.pay} />
            <input type="hidden" name="expectedGrandTotal" value={preview.totals.grandTotal} />
            {address ? (
              <p className="text-sm text-muted">
                Delivering to {address.fullName}, {address.city} {address.postalCode}.
              </p>
            ) : null}
            <PlaceOrderButton disabled={!canPlace}>
              Place order · {formatPrice(preview.totals.grandTotal)}
            </PlaceOrderButton>
            <p className="text-center text-xs text-muted">
              {!address
                ? "Add a delivery address to continue."
                : lineProblems.length > 0
                  ? "Fix the items in your bag to continue."
                  : codProblem
                    ? "Choose another way to pay to continue."
                    : chosen.pay === "COD"
                      ? "You'll pay the courier when your order arrives."
                      : "You'll pay securely online after placing your order."}
            </p>
          </form>
          <p className="text-center text-xs leading-relaxed text-muted">
            By placing your order you agree to our{" "}
            <PolicyLink href="/terms">Terms of use</PolicyLink> and{" "}
            <PolicyLink href="/returns">Exchange policy</PolicyLink>.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              `Exchange within ${returnRules.exchangeDays} days if defective`,
              "100% human hair",
              `Ships in ${returnRules.dispatchWorkingDays} working days`,
            ].map((promise) => (
              <p
                key={promise}
                className="flex flex-col items-center gap-1.5 rounded bg-sand p-2 text-[0.625rem] leading-tight font-bold"
              >
                <span aria-hidden className="text-gold">
                  ✦
                </span>
                {promise}
              </p>
            ))}
          </div>
          {whatsapp ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-sage/40 p-3.5">
              <span className="flex flex-col">
                <span className="text-xs font-bold">Unsure about your shade?</span>
                <span className="text-sm text-muted">Ask us before you pay</span>
              </span>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[0.625rem] font-bold tracking-wide uppercase shadow-sm transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
              >
                WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/** A policy opened beside checkout (a new tab), so the order in progress isn't left. */
function PolicyLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      className="underline underline-offset-2 hover:text-deep"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </Link>
  );
}
