"use client";

import { useEffect } from "react";

/**
 * Last-resort page when even the root layout fails. It renders its own
 * document without the site's CSS, so it uses inline brand styles.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Root layout failed", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#edf9e5",
          color: "#16362a",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <title>Something went wrong | HairCraft</title>
        <main>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "2.5rem" }}>
            Something went wrong
          </h1>
          <p>Sorry, the shop didn&apos;t load properly. Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1rem",
              background: "#16362a",
              color: "#edf9e5",
              border: 0,
              borderRadius: 999,
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
