"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { googleSignInAction } from "@/lib/session/phone-actions";
import { FormError } from "./auth-forms";

/** The bits of Google Identity Services this button uses. */
interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        ux_mode?: "popup" | "redirect";
        context?: "signin" | "signup" | "use";
        itp_support?: boolean;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type?: "standard" | "icon";
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "large" | "medium" | "small";
          text?: "signin_with" | "signup_with" | "continue_with";
          shape?: "rectangular" | "pill";
          width?: number;
          logo_alignment?: "left" | "center";
        },
      ): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/** Loads Google's script once per page, however many buttons ask. */
let loading: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Google's sign-in script could not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * "Continue with Google" (owner, 2026-11-04): Google's own button (their
 * brand rules ask for it). Picking an account gives this page an ID token,
 * which the server checks with the API and turns into a session.
 */
export function GoogleButton({
  clientId,
  next,
  mode,
}: {
  clientId: string;
  next: string | null;
  mode: "sign-in" | "register";
}) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedToLoad, setFailedToLoad] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        const google = window.google;
        if (cancelled || !google || !box.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          context: mode === "register" ? "signup" : "signin",
          itp_support: true,
          callback: ({ credential }) => {
            if (!credential) return setError("Google sign-in didn't work. Please try again.");
            setError(null);
            start(async () => {
              const result = await googleSignInAction(credential, next ?? "");
              if (!result.ok) setError(result.error);
            });
          },
        });
        box.current.replaceChildren();
        google.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          // Google draws at most 400 px wide.
          width: Math.min(400, Math.max(200, Math.floor(box.current.clientWidth))),
        });
      })
      .catch(() => {
        if (!cancelled) setFailedToLoad(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, mode, next]);

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      {failedToLoad ? (
        <p className="text-center text-sm text-muted">
          Google sign-in couldn&apos;t load here. Please use the form below instead.
        </p>
      ) : (
        <div
          ref={box}
          aria-busy={pending || undefined}
          className="flex min-h-11 w-full justify-center transition-opacity aria-busy:opacity-60"
        />
      )}
    </div>
  );
}
