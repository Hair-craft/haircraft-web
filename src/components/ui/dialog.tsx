"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { CloseIcon } from "./icons";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Shown as the heading and used as the accessible name. */
  title: string;
  children: ReactNode;
  /** `center` for a modal box, `left`/`right` for a drawer sliding in from that side. */
  placement?: "center" | "left" | "right";
  className?: string;
}

/**
 * Modal dialog and drawer, built on the native <dialog> element: the browser
 * traps focus inside, Escape closes it, and focus returns to the button that
 * opened it. Clicking the dimmed backdrop also closes it, and the page behind
 * does not scroll while it is open.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  placement = "center",
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const shape =
    placement === "center"
      ? "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl"
      : cx(
          "my-0 h-dvh max-h-dvh w-[min(22rem,88vw)]",
          placement === "left" ? "mr-auto ml-0 rounded-r-3xl" : "mr-0 ml-auto rounded-l-3xl",
        );

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onClose();
      }}
      onClick={(event) => {
        // A click on the <dialog> itself (not its content) is a click on the backdrop.
        if (event.target === ref.current) onClose();
      }}
      className={cx(
        "max-w-none bg-mint p-0 text-deep shadow-2xl backdrop:bg-deep/40 backdrop:backdrop-blur-[2px]",
        shape,
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-deep/10 px-6 py-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </dialog>
  );
}
