"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { changeCartAction, loadCartAction, type CartResult } from "@/lib/cart/actions";
import type { Cart, CartLine, SeenPrices } from "@/lib/cart/rules";

/**
 * Prices the shopper saw when adding items, kept on their device
 * (localStorage), so a line can say "Price changed from … to …".
 */
const SEEN_KEY = "hc-seen-prices";
const SEEN_EVENT = "hc-seen-prices";

function readSeen(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

function writeSeen(update: (seen: SeenPrices) => SeenPrices) {
  try {
    const next = update(JSON.parse(readSeen()) as SeenPrices);
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(SEEN_EVENT));
  } catch {
    // Private browsing or storage full: the price note is simply not shown.
  }
}

function subscribeSeen(callback: () => void) {
  window.addEventListener(SEEN_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SEEN_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** The remembered prices (empty on the server and before the page is interactive). */
export function useSeenPrices(): SeenPrices {
  const raw = useSyncExternalStore(subscribeSeen, readSeen, () => "{}");
  try {
    return JSON.parse(raw) as SeenPrices;
  } catch {
    return {};
  }
}

interface CartState {
  /** The bag, once loaded (null until the drawer or cart page needs it). */
  cart: Cart | null;
  count: number;
  drawerOpen: boolean;
  pending: boolean;
  /** The last problem, shown in the drawer. */
  error: string | null;
  freeShippingThreshold: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Adds to the bag and opens the drawer; resolves to the problem, or null. */
  add: (variantId: string, quantity: number, seenPrice: string) => Promise<string | null>;
  setQuantity: (line: CartLine, quantity: number) => void;
  remove: (line: CartLine) => void;
  /** A fresher bag from the server (the cart page). */
  adopt: (cart: Cart) => void;
}

const CartContext = createContext<CartState | null>(null);

export function useCart(): CartState {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}

/** The bag for the whole shop: the header count, the drawer and Add to bag share it. */
export function CartProvider({
  initialCount,
  freeShippingThreshold,
  children,
}: {
  initialCount: number;
  freeShippingThreshold: string | null;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [count, setCount] = useState(initialCount);
  // The server's count changes after signing in or out (the layout re-renders, this
  // component doesn't remount): follow it, and forget the bag loaded for the old shopper.
  // After this page's own change the server merely confirms the count it already shows,
  // so nothing is reset then.
  const [countFromServer, setCountFromServer] = useState(initialCount);
  if (countFromServer !== initialCount) {
    setCountFromServer(initialCount);
    if (initialCount !== count) {
      setCount(initialCount);
      setCart(null);
    }
  }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = useCallback((result: CartResult) => {
    if (result.cart) {
      setCart(result.cart);
      setCount(result.cart.itemCount);
    }
    setError(result.error);
  }, []);

  const value: CartState = {
    cart,
    count,
    drawerOpen,
    pending,
    error,
    freeShippingThreshold,
    openDrawer: () => {
      setDrawerOpen(true);
      setError(null);
      startTransition(async () => apply(await loadCartAction()));
    },
    closeDrawer: () => setDrawerOpen(false),
    add: (variantId, quantity, seenPrice) =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await changeCartAction({ kind: "add", variantId, quantity });
          if (result.error) {
            if (result.cart) {
              setCart(result.cart);
              setCount(result.cart.itemCount);
            }
            resolve(result.error);
            return;
          }
          apply(result);
          writeSeen((seen) => ({ ...seen, [variantId]: seenPrice }));
          setDrawerOpen(true);
          resolve(null);
        });
      }),
    setQuantity: (line, quantity) =>
      startTransition(async () =>
        apply(
          await changeCartAction({
            kind: "set",
            lineId: line.id,
            variantId: line.variantId,
            quantity,
          }),
        ),
      ),
    remove: (line) =>
      startTransition(async () => {
        const result = await changeCartAction({
          kind: "remove",
          lineId: line.id,
          variantId: line.variantId,
        });
        apply(result);
        if (!result.error)
          writeSeen((seen) => {
            const rest = { ...seen };
            delete rest[line.variantId];
            return rest;
          });
      }),
    adopt: (fresh) => {
      setCart(fresh);
      setCount(fresh.itemCount);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
