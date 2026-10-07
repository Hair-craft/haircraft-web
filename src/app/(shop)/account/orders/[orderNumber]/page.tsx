import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountCard } from "@/components/account/account-parts";
import { CancelOrder } from "@/components/account/cancel-order";
import { ProgressLine, StatusBadge } from "@/components/account/order-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { SummaryLines, TotalsList } from "@/components/checkout/checkout-parts";
import { PaymentPanel } from "@/components/checkout/payment-panel";
import { Button } from "@/components/ui/button";
import { localMobile } from "@/lib/account/rules";
import { isApiError } from "@/lib/api/errors";
import { panelState } from "@/lib/checkout/payment";
import { settings } from "@/lib/env";
import { buyAgainAction } from "@/lib/orders/actions";
import { getOrderDetail, type OrderDetail } from "@/lib/orders/api";
import { orderDate, orderDateTime, progressSteps, refundText } from "@/lib/orders/rules";
import { getSession } from "@/lib/session/session";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

const ORDER_NUMBER = /^HC-\d{4,10}$/i;

/** `/account/orders/HC-100001`: one order: progress, payment, tracking, items, cancel. */
export default async function OrderPage({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber: raw } = await params;
  if (!ORDER_NUMBER.test(raw)) notFound();
  const orderNumber = raw.toUpperCase();
  const here = `/account/orders/${orderNumber}`;
  const { accessToken } = await getSession();
  if (!accessToken) redirect(`/sign-in?next=${encodeURIComponent(here)}`);

  let order: OrderDetail | null = null;
  try {
    order = await getOrderDetail(accessToken, orderNumber);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED")
      redirect(`/bff/session/end?next=${encodeURIComponent(here)}`);
    // Someone else's order looks the same as one that doesn't exist.
    if (error.status === 404 || error.status === 400) notFound();
  }
  if (!order) return <ApiUnavailable retryHref={here} />;

  const payment = panelState(order);
  const refund = refundText(order.paymentStatus, order.grandTotal);
  const a = order.shippingAddress;
  const cancelled = order.status === "CANCELLED";
  const paidOnline = order.paymentMethod === "ONLINE" && order.paymentStatus === "PAID";

  return (
    <>
      <Link
        href="/account/orders"
        className="text-sm text-deep/70 underline-offset-4 hover:text-deep hover:underline"
      >
        ‹ All orders
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl sm:text-5xl">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="-mt-4 mb-6 text-sm text-deep/70">Placed on {orderDate(order.placedAt)}</p>

      <div className="flex flex-col gap-5">
        {cancelled ? (
          <AccountCard>
            <h2 className="font-display text-2xl">Cancelled</h2>
            <p className="mt-2 text-sm text-deep/75">
              {order.cancelledAt ? `On ${orderDateTime(order.cancelledAt)}. ` : ""}
              {order.cancellationReason ? `Reason: ${order.cancellationReason}` : ""}
            </p>
            {refund ? <p className="mt-3 text-sm font-medium">{refund}</p> : null}
          </AccountCard>
        ) : (
          <AccountCard>
            <ProgressLine steps={progressSteps(order)} />
            {order.tracking ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mint px-4 py-3 text-sm">
                <p>
                  Sent with <strong>{order.tracking.carrier}</strong>, tracking number{" "}
                  <strong>{order.tracking.trackingNumber}</strong>
                </p>
                {order.tracking.trackingUrl ? (
                  <a
                    href={order.tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    Track parcel<span className="sr-only"> (opens a new tab)</span>
                  </a>
                ) : null}
              </div>
            ) : null}
          </AccountCard>
        )}

        {payment === "payable" || payment === "waiting" ? (
          <PaymentPanel
            orderNumber={order.orderNumber}
            amount={order.grandTotal}
            state={payment}
            expiresAt={order.expiresAt}
            lastFailureMessage={order.payment.lastFailureMessage}
            autoStart={false}
            scriptUrl={settings().razorpayScriptUrl}
          />
        ) : null}

        <AccountCard className="flex flex-col gap-5">
          <h2 className="font-display text-2xl">Items</h2>
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
          {order.status === "DELIVERED" ? (
            <div className="rounded-2xl bg-mint px-4 py-3 text-sm">
              <p className="font-medium">How was it?</p>
              <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                {[...new Map(order.items.map((item) => [item.productSlug, item])).values()].map(
                  (item) => (
                    <li key={item.productSlug}>
                      <Link
                        href={`/product/${encodeURIComponent(item.productSlug)}/review?back=${encodeURIComponent(here)}`}
                        className="underline underline-offset-4 hover:text-deep"
                      >
                        Review {item.productName}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
          <form action={buyAgainAction}>
            <input type="hidden" name="orderNumber" value={order.orderNumber} />
            <Button type="submit" variant="secondary">
              Buy again
            </Button>
          </form>
        </AccountCard>

        <div className="grid gap-5 sm:grid-cols-2">
          <AccountCard>
            <h2 className="font-display text-2xl">Delivery address</h2>
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
          </AccountCard>
          <AccountCard>
            <h2 className="font-display text-2xl">Payment</h2>
            <p className="mt-3 text-sm">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Online"}
              {paidOnline ? " · Paid" : ""}
            </p>
            {!cancelled && refund ? <p className="mt-2 text-sm">{refund}</p> : null}
            <p className="mt-4 text-sm text-deep/70">
              Need help with this order?{" "}
              <Link href="/contact" className="underline underline-offset-4 hover:text-deep">
                Contact us
              </Link>{" "}
              or read{" "}
              <Link href="/returns" className="underline underline-offset-4 hover:text-deep">
                Returns &amp; refunds
              </Link>
              .
            </p>
          </AccountCard>
        </div>

        {order.canCancel ? <CancelOrder orderNumber={order.orderNumber} paid={paidOnline} /> : null}
      </div>
    </>
  );
}
