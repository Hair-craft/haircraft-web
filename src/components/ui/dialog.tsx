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
  /** In place of the plain heading row (the close button stays): e.g. the bag's header. */
  header?: ReactNode;
  /** `white` for panels on white (the bag); mint otherwise. */
  surface?: "mint" | "white";
  /** Pinned under the scrolling content (e.g. the bag's totals and buttons). */
  footer?: ReactNode;
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
  header,
  surface = "mint",
  footer,
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
          placement === "left" ? "mr-auto ml-0" : "mr-0 ml-auto",
          // White panels (the bag) are square, as in the design; others are rounded on the open side.
          surface === "white" ? "" : placement === "left" ? "rounded-r-3xl" : "rounded-l-3xl",
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
        "max-w-none p-0 text-deep shadow-2xl backdrop:bg-[#071b11]/45 backdrop:backdrop-blur-[2px]",
        surface === "white" ? "bg-white" : "bg-mint",
        shape,
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {header ? (
          <div className="relative shrink-0 border-b border-line bg-cream p-5">
            {header}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-sand transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
              aria-label="Close"
            >
              <CloseIcon width={20} height={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
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
        )}
        <div className={cx("flex-1 overflow-y-auto", header ? "p-5" : "px-6 py-5")}>{children}</div>
        {footer ? <div className="shrink-0">{footer}</div> : null}
      </div>
    </dialog>
  );
}
