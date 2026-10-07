import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ApiUnavailable } from "@/components/api-unavailable";
import { SummaryLines, TotalsList } from "@/components/checkout/checkout-parts";
import { PaymentPanel } from "@/components/checkout/payment-panel";
import { ButtonLink } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";
import { getOrder, type PlacedOrder } from "@/lib/checkout/api";
import { panelState } from "@/lib/checkout/payment";
import { nextSteps } from "@/lib/checkout/rules";
import { settings } from "@/lib/env";
import { localMobile } from "@/lib/account/rules";
import { getSession } from "@/lib/session/session";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

const ORDER_NUMBER = /^HC-\d{4,10}$/i;

/** `/checkout/placed/HC-100001`: the order just placed (only its own customer sees it). */
export default async function OrderPlacedPage({
  params,
  searchParams,
}: PageProps<"/checkout/placed/[orderNumber]">) {
  const { orderNumber } = await params;
  // ?pay=1: just placed with Pay online, so the payment window opens straight away.
  const autoStart = (await searchParams).pay === "1";
  if (!ORDER_NUMBER.test(orderNumber)) notFound();
  const here = `/checkout/placed/${encodeURIComponent(orderNumber)}`;
  const session = await getSession();
  if (!session.accessToken) redirect(`/sign-in?next=${encodeURIComponent(here)}`);

  let order: PlacedOrder | null = null;
  try {
    order = await getOrder(session.accessToken, orderNumber);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED")
      redirect(`/bff/session/end?next=${encodeURIComponent(here)}`);
    // Someone else's order looks the same as one that doesn't exist.
    if (error.status === 404 || error.status === 400) notFound();
  }
  if (!order) return <ApiUnavailable retryHref={here} />;

  const steps = nextSteps(order);
  const payment = panelState(order);
  const a = order.shippingAddress;
  const name = session.user?.firstName;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">
        Order {order.orderNumber}
      </p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Thank you{name ? `, ${name}` : ""}</h1>
      <p className="mt-3 text-deep/75">
        Your order <strong>{order.orderNumber}</strong> is placed.
      </p>

      <div className="mt-8">
        {payment === "none" ? (
          <section
            aria-labelledby="next-title"
            className="rounded-[2rem] border border-gold/40 bg-gold/10 p-6"
          >
            <h2 id="next-title" className="font-display text-2xl">
              {steps.title}
            </h2>
            <p className="mt-2 text-sm text-deep/80">{steps.text}</p>
          </section>
        ) : (
          <PaymentPanel
            orderNumber={order.orderNumber}
            amount={order.grandTotal}
            state={payment}
            expiresAt={order.expiresAt}
            lastFailureMessage={order.payment.lastFailureMessage}
            autoStart={autoStart}
            scriptUrl={settings().razorpayScriptUrl}
          />
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5">
          <h2 className="font-display text-2xl">Delivering to</h2>
          <address className="mt-3 text-sm not-italic">
            <p className="font-medium">{a.fullName}</p>
            <p className="text-deep/75">{a.line1}</p>
            {a.line2 ? <p className="text-deep/75">{a.line2}</p> : null}
            {a.landmark ? <p className="text-deep/75">Near {a.landmark}</p> : null}
            <p className="text-deep/75">
              {a.city}, {a.state} {a.postalCode}
            </p>
            <p className="mt-1 text-deep/75">Mobile: {localMobile(a.phone)}</p>
          </address>
          {order.notes ? (
            <p className="mt-3 text-sm text-deep/75">
              <span className="font-medium text-deep">Instructions:</span> {order.notes}
            </p>
          ) : null}
        </section>
        <section className="rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5">
          <h2 className="font-display text-2xl">Payment</h2>
          <p className="mt-3 text-sm">
            {order.paymentMethod === "COD" ? "Cash on delivery" : "Online"}
          </p>
        </section>
      </div>

      <section className="mt-6 flex flex-col gap-5 rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5">
        <h2 className="font-display text-2xl">Your order</h2>
        <SummaryLines
          lines={order.items.map((item, index) => ({
            key: `${index}`,
            name: item.productName,
            slug: item.productSlug,
            option: item.variantLabel,
            image: item.imageUrl,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          }))}
        />
        <TotalsList
          totals={{
            subtotal: order.subtotal,
            discount: order.discountTotal,
            shipping: order.shippingTotal,
            grandTotal: order.grandTotal,
            gstIncluded: order.taxIncluded,
          }}
          couponCode={order.couponCode}
        />
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
        <ButtonLink href={`/account/orders/${order.orderNumber}`} variant="secondary">
          View your order
        </ButtonLink>
      </div>
    </div>
  );
}
