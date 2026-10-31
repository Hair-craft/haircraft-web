import { business } from "@/content/business";
import { returnRules } from "@/content/returns-rules";
import { whatsappChatHref } from "@/lib/info/contact";

/** What the shop page's banner lists beside the WhatsApp offer (the real policies). */
const promises = [
  {
    title: "Exchange for defective items",
    text: `Within ${returnRules.exchangeDays} days of delivery, if unused`,
  },
  { title: "Secure payments", text: "UPI, cards, net banking and wallets" },
  {
    title: "Quick dispatch",
    text: `Packed and sent in ${returnRules.dispatchWorkingDays} working days`,
  },
];

/**
 * The emerald WhatsApp advice banner (home page and shop pages), hidden
 * when the business has no WhatsApp. With `promises`, a short list of the
 * shop's real policies sits beside it.
 */
export function ConsultBanner({
  headingId,
  promises: withPromises = false,
}: {
  headingId: string;
  promises?: boolean;
}) {
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
          <p className="text-base leading-relaxed text-white/85 sm:text-lg">
            Send us a daylight photo of your hair on WhatsApp, and we&apos;ll help you choose the
            shade, length and texture that suit you, before you buy.
          </p>
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
        {withPromises ? (
          <ul className="flex w-full max-w-xs shrink-0 flex-col gap-4 rounded-2xl bg-white/10 p-6 backdrop-blur-md md:w-auto">
            {promises.map((promise) => (
              <li key={promise.title} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-light"
                >
                  ✦
                </span>
                <span>
                  <span className="block font-display font-semibold">{promise.title}</span>
                  <span className="block text-sm text-white/75">{promise.text}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
