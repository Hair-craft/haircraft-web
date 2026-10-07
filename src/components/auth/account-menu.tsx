"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { UserIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { signOutAction } from "@/lib/session/actions";
import { FLASH_COOKIE } from "@/lib/session/cookies";

const iconLink =
  "inline-flex rounded-full p-2 transition-colors hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep";

/**
 * The header's account control. Guests: a "Sign in" icon link. Signed in:
 * the first letter of the name, opening a small menu (My account, Sign out).
 * Escape or a click outside closes it.
 */
export function AccountMenu({ firstName }: { firstName: string | null }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  if (firstName === null)
    return (
      <Link href="/sign-in" className={iconLink} aria-label="Sign in">
        <UserIcon />
      </Link>
    );

  const initial = firstName.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      ref={root}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-label={`Account menu for ${firstName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 items-center justify-center rounded-full bg-deep font-medium text-mint hover:bg-deep-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
      >
        {initial}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute top-full right-0 z-40 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 shadow-deep/10 ring-deep/10"
        >
          <p className="px-3 py-2 text-sm text-deep/70">Hello, {firstName}</p>
          <Link
            href="/account"
            role="menuitem"
            className="block rounded-xl px-3 py-2 hover:bg-mint focus-visible:bg-mint focus-visible:outline-none"
          >
            My account
          </Link>
          <Link
            href="/wishlist"
            role="menuitem"
            className="block rounded-xl px-3 py-2 hover:bg-mint focus-visible:bg-mint focus-visible:outline-none"
          >
            My wishlist
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-mint focus-visible:bg-mint focus-visible:outline-none"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const FLASH_MESSAGES: Record<string, string> = {
  "signed-out": "You're signed out.",
  "signed-out-everywhere": "You're signed out on all your devices.",
  "cart-skipped": "Some items from your bag couldn't be added: they're no longer available.",
  "address-added": "Address added.",
  "address-updated": "Address saved.",
  "address-deleted": "Address deleted.",
  "address-default": "Default address changed.",
  "password-changed": "Password changed. You've been signed out on your other devices.",
  "order-cancelled": "Your order is cancelled.",
  "review-sent": "Thank you! Your review will appear once it's approved.",
  "review-updated": "Review saved. It will appear again once it's approved.",
  "review-deleted": "Review deleted.",
};

/**
 * Shows a one-time note left by the server (e.g. after signing out), then
 * removes it. The layout reads the note on the server and passes it in, so
 * it also appears after an in-page redirect (the layout re-renders on the
 * server after a sign-out, but this component doesn't mount again).
 */
export function FlashNote({ note }: { note: string | null }) {
  const { show } = useToast();
  useEffect(() => {
    if (!note) return;
    document.cookie = `${FLASH_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    const message = FLASH_MESSAGES[note];
    if (message) show(message, note === "cart-skipped" ? "info" : "success");
  }, [note, show]);
  return null;
}
