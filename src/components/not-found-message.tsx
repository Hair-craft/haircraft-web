import { routes } from "@/components/layout/nav";
import { ButtonLink } from "@/components/ui/button";

/** The "page not found" message, without the header and footer around it. */
export function NotFoundMessage() {
  return (
    <section className="mx-auto my-20 flex max-w-xl flex-col items-center gap-4 px-4 text-center">
      <p className="text-sm tracking-[0.3em] text-deep-soft uppercase">404</p>
      <h1 className="font-display text-5xl">We couldn&apos;t find that page</h1>
      <p className="text-deep/75">
        The link may be old, or the page may have moved. Let&apos;s get you back to something
        beautiful.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <ButtonLink href={routes.home}>Go to the home page</ButtonLink>
        <ButtonLink href={routes.shop} variant="secondary">
          Browse the shop
        </ButtonLink>
      </div>
    </section>
  );
}
