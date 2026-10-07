"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Something failed while showing a shop page. The header and footer stay;
 * the customer gets a calm message and a retry, never technical details.
 */
export default function ShopError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Shop page failed", error.digest ?? error.message);
  }, [error]);

  return (
    <section
      role="alert"
      className="mx-auto my-20 flex max-w-xl flex-col items-center gap-4 px-4 text-center"
    >
      <h1 className="font-display text-4xl">Something went wrong</h1>
      <p className="text-deep/75">
        Sorry, this page didn&apos;t load properly. Please try again; if it keeps happening, come
        back in a few minutes.
      </p>
      {error.digest ? <p className="text-xs text-deep/70">Reference: {error.digest}</p> : null}
      <div className="mt-2 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go to the home page
        </ButtonLink>
      </div>
    </section>
  );
}
