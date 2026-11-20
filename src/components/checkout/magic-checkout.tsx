"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  closeMagicCheckoutAction,
  completeMagicCheckoutAction,
  openMagicCheckoutAction,
} from "@/lib/checkout/magic-actions";

/**
 * Razorpay Magic Checkout (owner, 2026-11-20), like Nish Hair: Buy now and
 * the bag open Razorpay's own window right on the page. The shopper logs in
 * there with their phone number, picks a saved address (or adds one),
 * applies a coupon and pays online or chooses cash on delivery. There is no
 * checkout page. Closing the window without paying cancels the order;
 * nothing is charged.
 */

interface MagicWindow {
  open(): void;
}
type MagicWindowClass = new (options: Record<string, unknown>) => MagicWindow;

/** Loads Magic Checkout's script once (only when someone buys). */
const scripts = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  let loading = scripts.get(src);
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scripts.delete(src);
        script.remove();
        reject(new Error("Razorpay's script didn't load"));
      };
      document.head.appendChild(script);
    });
    scripts.set(src, loading);
  }
  return loading;
}

type Items = { variantId: string; quantity: number }[];

interface OpenOptions {
  /**
   * Just before Razorpay's window appears, e.g. closing the bag drawer, which
   * sits in the browser's top layer and would cover it (owner, 2026-11-20).
   */
  beforeOpen?: () => void;
}

interface MagicCheckout {
  /** Magic Checkout is on (Razorpay activated it for the shop). */
  enabled: boolean;
  /** A window is opening or a result is being confirmed. */
  busy: boolean;
  /** Opens the window; resolves with a problem to show, or null. */
  open(items: Items, fromBag: boolean, options?: OpenOptions): Promise<string | null>;
  /** The last note after the window (e.g. closed without paying). */
  note: string | null;
}

const Context = createContext<MagicCheckout>({
  enabled: false,
  busy: false,
  open: async () => null,
  note: null,
});

export function useMagicCheckout(): MagicCheckout {
  return useContext(Context);
}

const placedUrl = (orderNumber: string, receiptToken: string | null) =>
  `/checkout/placed/${encodeURIComponent(orderNumber)}${receiptToken ? `?t=${receiptToken}` : ""}`;

export function MagicCheckoutProvider({
  enabled,
  scriptUrl,
  children,
}: {
  enabled: boolean;
  scriptUrl: string;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const open = useCallback(
    async (items: Items, fromBag: boolean, options: OpenOptions = {}): Promise<string | null> => {
      setNote(null);
      setBusy(true);
      const opened = await openMagicCheckoutAction(items, fromBag);
      if (!opened.ok) {
        setBusy(false);
        return opened.message;
      }
      try {
        await loadScript(scriptUrl);
      } catch {
        setBusy(false);
        // The order waiting for this window is let go.
        void closeMagicCheckoutAction(opened.start.razorpayOrderId);
        return "We couldn't open the payment window. Nothing has been charged. Please check your connection (or turn off an ad blocker) and try again.";
      }
      const s = opened.start;
      const Razorpay = (window as unknown as { Razorpay?: MagicWindowClass }).Razorpay;
      if (!Razorpay) {
        setBusy(false);
        return "We couldn't open the payment window. Please try again.";
      }
      // A full page load afterwards, so the bag count and the order are fresh.
      const finish = (orderNumber: string, receiptToken: string | null) =>
        window.location.assign(placedUrl(orderNumber, receiptToken));
      const checkout = new Razorpay({
        key: s.keyId,
        order_id: s.razorpayOrderId,
        one_click_checkout: true,
        show_coupons: true,
        name: s.name,
        ...(s.prefill
          ? {
              prefill: {
                name: s.prefill.name,
                email: s.prefill.email ?? "",
                contact: s.prefill.contact ?? "",
              },
            }
          : {}),
        theme: { color: "#0b291a" },
        handler: async (response: unknown) => {
          setNote("Confirming your order…");
          const done = await completeMagicCheckoutAction(s.razorpayOrderId, response, fromBag);
          if (done.ok && done.result.status === "completed") {
            finish(done.result.orderNumber, done.result.receiptToken);
            return;
          }
          setBusy(false);
          setNote(
            done.ok
              ? "Your bank is still confirming the payment. We'll update your order as soon as it's through; there's no need to pay again."
              : done.message,
          );
        },
        modal: {
          ondismiss: async () => {
            const closed = await closeMagicCheckoutAction(s.razorpayOrderId);
            setBusy(false);
            if (closed.ok && closed.result.status === "completed") {
              finish(closed.result.orderNumber, closed.result.receiptToken);
              return;
            }
            setNote("Payment not completed, so nothing was charged. You can try again.");
          },
        },
      });
      options.beforeOpen?.();
      checkout.open();
      return null;
    },
    [scriptUrl],
  );

  const value = useMemo(() => ({ enabled, busy, open, note }), [enabled, busy, open, note]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
