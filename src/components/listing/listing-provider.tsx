"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { cx } from "@/lib/cx";

interface ListingNavigation {
  /** Shows a new listing address. The current results stay on screen (dimmed) until the new ones arrive. */
  navigate: (href: string) => void;
  pending: boolean;
}

const ListingContext = createContext<ListingNavigation | null>(null);

export function ListingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  return (
    <ListingContext.Provider value={{ navigate, pending }}>{children}</ListingContext.Provider>
  );
}

export function useListing(): ListingNavigation {
  const value = useContext(ListingContext);
  if (!value) throw new Error("useListing must be used inside <ListingProvider>");
  return value;
}

const noop = () => () => {};

/**
 * False in the server HTML and the first browser render, true once the page
 * is interactive. Used to hide the "Apply" buttons that only people without
 * JavaScript need.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** The results area: dimmed and marked busy while new results load. */
export function ListingResults({ children }: { children: ReactNode }) {
  const { pending } = useListing();
  return (
    <div
      aria-busy={pending || undefined}
      className={cx("transition-opacity duration-200", pending && "opacity-50")}
    >
      {children}
    </div>
  );
}
