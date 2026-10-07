import { ButtonLink } from "@/components/ui/button";

/** Shown in place of content that needs the API while it can't be reached. */
export function ApiUnavailable({ retryHref = "/" }: { retryHref?: string }) {
  return (
    <section
      role="status"
      className="mx-auto my-16 flex max-w-xl flex-col items-center gap-4 rounded-3xl bg-white/70 px-8 py-12 text-center"
    >
      <h2 className="font-display text-3xl">We&apos;ll be right back</h2>
      <p className="text-deep/75">
        We can&apos;t reach the shop at the moment. Your cart and account are safe. Please try again
        in a minute.
      </p>
      <ButtonLink href={retryHref} variant="secondary">
        Try again
      </ButtonLink>
    </section>
  );
}
