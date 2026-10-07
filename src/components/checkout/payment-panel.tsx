"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { LockIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { deadlineText, failedMessage, minutesLeft, type PanelState } from "@/lib/checkout/payment";
import { startPaymentAction, verifyPaymentAction } from "@/lib/checkout/payment-actions";

/** Razorpay Checkout's browser API (the parts used here). */
interface RazorpayInstance {
  open(): void;
  on(
    event: "payment.failed",
    callback: (response: { error?: { description?: unknown } }) => void,
  ): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Loads Razorpay's script once per page (only when someone pays). */
let scriptLoading: Promise<void> | null = null;
function loadScript(src: string): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      script.remove();
      reject(new Error("Razorpay's script didn't load"));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

type Note = { tone: "info" | "error"; text: string } | null;

/** How often, and how many times, a payment the bank is still confirming is checked again. */
const RECHECK_MS = 5000;
const RECHECKS = 12;

/**
 * The order's payment: Pay now (Razorpay's window), the time left, and what
 * happened last. The page is re-read from the API after each step, so the
 * panel always shows the order's real state. Reused by My orders (S12).
 */
export function PaymentPanel({
  orderNumber,
  amount,
  state,
  expiresAt,
  lastFailureMessage,
  autoStart,
  scriptUrl,
}: {
  orderNumber: string;
  amount: string;
  state: PanelState;
  expiresAt: string | null;
  lastFailureMessage: string | null;
  /** Open the payment window straight away (just after Place order). */
  autoStart: boolean;
  scriptUrl: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(
    lastFailureMessage ? { tone: "error", text: lastFailureMessage } : null,
  );
  const [rechecking, setRechecking] = useState(state === "waiting");
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(false);

  // The time left, kept roughly current.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // A payment the bank is still confirming: look again for a minute.
  useEffect(() => {
    if (!rechecking || state === "paid" || state === "cancelled") return;
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= RECHECKS) {
        window.clearInterval(timer);
        setRechecking(false);
      }
    }, RECHECK_MS);
    return () => window.clearInterval(timer);
  }, [rechecking, state, router]);

  const pay = useCallback(async () => {
    setBusy(true);
    setNote(null);
    const start = await startPaymentAction(orderNumber);
    if (!start.ok) {
      setBusy(false);
      if (start.sessionEnded) {
        // A full page load: the route handler clears the session cookies (not a page).
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/bff/session/end?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setNote({ tone: "error", text: start.outcome.message });
      if (start.outcome.kind === "changed") router.refresh();
      return;
    }
    try {
      await loadScript(scriptUrl);
    } catch {
      setBusy(false);
      setNote({
        tone: "error",
        text: "We couldn't open the payment window. Nothing has been charged. Please check your connection (or turn off an ad blocker) and try again.",
      });
      return;
    }
    const c = start.checkout;
    const Razorpay = window.Razorpay!;
    const checkout = new Razorpay({
      key: c.keyId,
      order_id: c.razorpayOrderId,
      amount: c.amount,
      currency: c.currency,
      name: c.name,
      description: c.description,
      prefill: { name: c.prefill.name, email: c.prefill.email, contact: c.prefill.contact ?? "" },
      notes: c.notes,
      timeout: c.timeoutSeconds,
      theme: { color: "#16362a" },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setNote((current) =>
            current?.tone === "error"
              ? current
              : { tone: "info", text: "Payment not completed. You can try again." },
          );
        },
      },
      handler: async (response: unknown) => {
        setNote({ tone: "info", text: "Confirming your payment…" });
        const verified = await verifyPaymentAction(orderNumber, response);
        setBusy(false);
        if (verified.ok) {
          setNote(null);
          router.refresh();
          return;
        }
        if (verified.sessionEnded) {
          // A full page load: the route handler clears the session cookies (not a page).
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`/bff/session/end?next=${encodeURIComponent(pathname)}`);
          return;
        }
        setNote({
          tone: verified.outcome.kind === "pending" ? "info" : "error",
          text: verified.outcome.message,
        });
        if (verified.outcome.kind === "pending") setRechecking(true);
        else router.refresh();
      },
    });
    checkout.on("payment.failed", (response) =>
      setNote({ tone: "error", text: failedMessage(response.error?.description) }),
    );
    checkout.open();
  }, [orderNumber, pathname, router, scriptUrl]);

  // Just after Place order: open the window once, and drop ?pay=1 so a reload doesn't reopen it.
  useEffect(() => {
    if (!autoStart || started.current) return;
    // From a timer, so it runs once even when React runs effects twice (development).
    const timer = window.setTimeout(() => {
      if (started.current) return;
      started.current = true;
      router.replace(pathname, { scroll: false });
      if (state === "payable") void pay();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoStart, state, pay, pathname, router]);

  if (state === "none") return null;

  if (state === "paid")
    return (
      <section
        aria-labelledby="payment-title"
        className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6"
      >
        <h2 id="payment-title" className="font-display text-2xl text-emerald-900">
          Payment received
        </h2>
        <p className="mt-2 text-sm text-emerald-900">
          {formatPrice(amount)} paid online. Your order is confirmed.
        </p>
      </section>
    );

  if (state === "cancelled")
    return (
      <section
        aria-labelledby="payment-title"
        className="rounded-[2rem] border border-deep/15 bg-white/80 p-6"
      >
        <h2 id="payment-title" className="font-display text-2xl">
          Not paid
        </h2>
        <p className="mt-2 text-sm text-deep/75">
          This order was cancelled because it wasn&apos;t paid in time. Nothing was charged, and the
          items were put back on sale.
        </p>
        <ButtonLink href="/shop" className="mt-4">
          Shop again
        </ButtonLink>
      </section>
    );

  const deadline = deadlineText(minutesLeft(expiresAt, now));
  return (
    <section
      aria-labelledby="payment-title"
      className="rounded-[2rem] border border-gold/40 bg-gold/10 p-6"
    >
      <h2 id="payment-title" className="font-display text-2xl">
        {state === "waiting" ? "Waiting for your bank" : "Awaiting payment"}
      </h2>
      <p className="mt-2 text-sm text-deep/80">
        {state === "waiting"
          ? "Your payment is being confirmed. This page updates by itself; there's no need to pay again."
          : deadline}
      </p>
      {note ? (
        <p
          role={note.tone === "error" ? "alert" : "status"}
          className={cx(
            "mt-4 rounded-2xl px-4 py-3 text-sm",
            note.tone === "error" ? "bg-red-50 text-red-800" : "bg-white/80 text-deep",
          )}
        >
          {note.text}
        </p>
      ) : null}
      {state === "payable" ? (
        <>
          <Button
            size="lg"
            className="mt-5 w-full sm:w-auto"
            loading={busy}
            onClick={() => void pay()}
          >
            Pay {formatPrice(amount)} now
          </Button>
          <p className="mt-3 flex items-center gap-2 text-xs text-deep/70">
            <LockIcon width={14} height={14} />
            Secure payment by Razorpay: UPI, cards, net banking and wallets.
          </p>
          <noscript>
            <p className="mt-3 text-sm text-red-800">
              Paying online needs JavaScript. Please turn it on in your browser to pay.
            </p>
          </noscript>
        </>
      ) : !rechecking ? (
        <Button variant="secondary" className="mt-5" onClick={() => router.refresh()}>
          Check again
        </Button>
      ) : null}
    </section>
  );
}
