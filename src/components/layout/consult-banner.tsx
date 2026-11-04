import { business } from "@/content/business";
import { whatsappChatHref } from "@/lib/info/contact";

/**
 * The emerald WhatsApp advice banner (home page and shop pages), hidden
 * when the business has no WhatsApp. Kept short (owner, 2026-11-04).
 */
export function ConsultBanner({ headingId }: { headingId: string }) {
  const href = whatsappChatHref(business);
  if (!href) return null;
  return (
    <section
      aria-labelledby={headingId}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-deep to-deep-hover p-8 text-white shadow-xl lg:p-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-gold/15 blur-3xl"
      />
      <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="flex max-w-xl flex-col items-start gap-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-sage/20 px-3 py-1 text-xs font-semibold text-sage">
            <span aria-hidden className="size-2 rounded-full bg-[#25d366]" />
            Free advice on WhatsApp
          </p>
          <h2 id={headingId} className="font-display text-3xl font-semibold sm:text-4xl">
            Unsure about your shade or length?
          </h2>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 text-sm font-semibold text-deep shadow-lg transition-colors hover:bg-[#20ba5a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-95"
          >
            Chat on WhatsApp
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
