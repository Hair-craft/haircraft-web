"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { HeartIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { cx } from "@/lib/cx";
import {
  heartFormAction,
  leaveWishlistAction,
  loadSavedIdsAction,
  toggleSaveAction,
} from "@/lib/wishlist/actions";
import { heartLabel } from "@/lib/wishlist/rules";

/** Set on the wishlist page when "Move to bag" sends the shopper to choose an option. */
const MOVING_KEY = "hc-moving-to-bag";

interface WishlistState {
  signedIn: boolean;
  /** Saved product ids, once known (null while loading, and for guests). */
  saved: Set<string> | null;
  count: number;
  toggle: (productId: string, name: string) => void;
  /** Replace the saved ids and count (after a change made elsewhere, e.g. Move to bag). */
  adopt: (ids: string[], count: number) => void;
  /** After adding a product to the bag: if it was being moved from the wishlist, it leaves it. */
  addedToBag: (productId: string) => void;
}

const WishlistContext = createContext<WishlistState | null>(null);

export function useWishlist(): WishlistState {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return value;
}

/** Remembers that a product is being moved to the bag via its page (this tab only). */
export function markMoving(productId: string) {
  try {
    sessionStorage.setItem(MOVING_KEY, productId);
  } catch {
    // Without storage the product simply stays in the wishlist.
  }
}

/**
 * The wishlist for the whole shop: which hearts are filled, the header count
 * and the guest's "sign in to save" panel. For signed-in shoppers the saved
 * ids are asked for once per page load; guests never cost a request.
 */
export function WishlistProvider({
  signedIn,
  initialCount,
  children,
}: {
  signedIn: boolean;
  initialCount: number;
  children: ReactNode;
}) {
  const { show } = useToast();
  const [saved, setSaved] = useState<Set<string> | null>(null);
  const [count, setCount] = useState(initialCount);
  const [guestPanel, setGuestPanel] = useState(false);
  // Signing in or out re-renders the layout without remounting this: start again.
  const [shownFor, setShownFor] = useState(signedIn);
  if (shownFor !== signedIn) {
    setShownFor(signedIn);
    setSaved(null);
    setCount(initialCount);
  }

  useEffect(() => {
    if (!signedIn) return;
    let current = true;
    loadSavedIdsAction().then((result) => {
      if (!current || result.savedIds === null) return;
      setSaved(new Set(result.savedIds));
      setCount(result.count ?? 0);
    });
    return () => {
      current = false;
    };
  }, [signedIn]);

  const value: WishlistState = {
    signedIn,
    saved,
    count,
    toggle: (productId, name) => {
      const wasSaved = saved?.has(productId) ?? false;
      if (!signedIn) {
        void toggleSaveAction(productId, true);
        setGuestPanel(true);
        return;
      }
      // Instantly, then confirmed (or undone) by the API.
      const optimistic = new Set(saved ?? []);
      if (wasSaved) optimistic.delete(productId);
      else optimistic.add(productId);
      setSaved(optimistic);
      setCount((c) => Math.max(0, c + (wasSaved ? -1 : 1)));
      void toggleSaveAction(productId, !wasSaved).then((result) => {
        if (result.savedIds) {
          setSaved(new Set(result.savedIds));
          setCount(result.count ?? 0);
          show(
            wasSaved ? `Removed ${name} from your wishlist.` : `Saved ${name} to your wishlist.`,
            "success",
          );
        } else {
          setSaved(saved);
          setCount((c) => Math.max(0, c + (wasSaved ? 1 : -1)));
          if (result.error) show(result.error, "error");
        }
      });
    },
    adopt: (ids, newCount) => {
      setSaved(new Set(ids));
      setCount(newCount);
    },
    addedToBag: (productId) => {
      let moving: string | null = null;
      try {
        moving = sessionStorage.getItem(MOVING_KEY);
        if (moving === productId) sessionStorage.removeItem(MOVING_KEY);
      } catch {
        moving = null;
      }
      if (moving !== productId) return;
      void leaveWishlistAction(productId).then((result) => {
        if (result.savedIds) {
          setSaved(new Set(result.savedIds));
          setCount(result.count ?? 0);
        }
      });
    },
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
      <GuestPanel open={guestPanel} onClose={() => setGuestPanel(false)} />
    </WishlistContext.Provider>
  );
}

function GuestPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname);
  return (
    <Dialog open={open} onClose={onClose} title="Save your favourites">
      <p className="text-deep/75">
        Sign in or create an account to keep a wishlist. We&apos;ll save this one for you as soon as
        you do.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/sign-in?next=${next}`} className="flex-1" onClick={onClose}>
          Sign in
        </ButtonLink>
        <ButtonLink
          href={`/register?next=${next}`}
          variant="secondary"
          className="flex-1"
          onClick={onClose}
        >
          Create an account
        </ButtonLink>
      </div>
    </Dialog>
  );
}

/**
 * The heart on cards and the product page. A real form (it works without
 * JavaScript, coming back to the same page); with JavaScript it changes at
 * once.
 */
export function HeartButton({
  productId,
  name,
  size = "small",
  className,
}: {
  productId: string;
  name: string;
  size?: "small" | "large";
  className?: string;
}) {
  const { saved, toggle } = useWishlist();
  const pathname = usePathname();
  const isSaved = saved?.has(productId) ?? false;
  return (
    <form
      action={heartFormAction}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        toggle(productId, name);
      }}
      className={className}
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="save" value={isSaved ? "0" : "1"} />
      <input type="hidden" name="back" value={pathname} />
      <button
        type="submit"
        aria-pressed={isSaved}
        aria-label={heartLabel(name, isSaved)}
        className={cx(
          "flex items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-deep/10 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
          size === "large" ? "size-12" : "size-11",
          isSaved ? "text-gold" : "text-deep",
        )}
      >
        <HeartIcon
          width={size === "large" ? 22 : 18}
          height={size === "large" ? 22 : 18}
          className={cx(isSaved && "fill-current", "transition-transform", isSaved && "scale-110")}
        />
      </button>
    </form>
  );
}

/** The header's heart: the count, linking to the wishlist page. */
export function WishlistLink({ className }: { className?: string }) {
  const { count } = useWishlist();
  return (
    <Link
      href="/wishlist"
      aria-label={count > 0 ? `Wishlist, ${count} ${count === 1 ? "item" : "items"}` : "Wishlist"}
      className={cx(
        "relative rounded-full p-2 transition-colors hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep",
        className,
      )}
    >
      <HeartIcon />
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
