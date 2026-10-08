"use client";

import Image from "next/image";
import { amazon, flipkart, type FlipkartProduct } from "./links";

/** Sends a Meta Pixel event for a tap, when the Pixel is on. */
function track(event: string, data?: Record<string, string>) {
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  fbq?.("trackCustom", event, data);
}

/**
 * The marketplace buttons in each marketplace's own colours (as on the
 * original Shop now page): Amazon #232f3e with its orange #ff9900, Flipkart
 * #2874f0 with its yellow #ffe11b. The text is bold and 19 px, so white on Flipkart's blue (4.3:1)
 * counts as large text and stays readable.
 */
const button =
  "flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl px-5 py-4 text-[1.1875rem] font-bold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16362a] active:scale-[0.98] active:opacity-90";

export function AmazonButton() {
  return (
    <a
      href={amazon.href}
      onClick={() => track(amazon.event)}
      className={`${button} bg-[#232f3e] hover:bg-[#2f3d50]`}
    >
      <span>
        Shop on <span className="text-[#ff9900]">amazon</span>
      </span>
    </a>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-[#2874f0]"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Flipkart: with no products listed, a plain button to HairCraft on
 * Flipkart. With products, a dropdown of them (a native `<details>`, so it
 * opens by tap, mouse or keyboard, and without JavaScript), each opening its
 * Flipkart page, then "See all on Flipkart".
 */
export function FlipkartButton({ products }: { products: FlipkartProduct[] }) {
  if (products.length === 0)
    return (
      <a
        href={flipkart.href}
        onClick={() => track(flipkart.event)}
        className={`${button} bg-[#2874f0] hover:bg-[#1f63d6]`}
      >
        <span>
          Shop on <span className="text-[#ffe11b]">Flipkart</span>
        </span>
      </a>
    );
  return (
    <details className="group">
      <summary
        className={`${button} cursor-pointer list-none bg-[#2874f0] hover:bg-[#1f63d6] group-open:rounded-b-none [&::-webkit-details-marker]:hidden`}
      >
        <span>
          Shop on <span className="text-[#ffe11b]">Flipkart</span>
        </span>
        <Chevron />
      </summary>
      <ul
        aria-label="HairCraft products on Flipkart"
        className="divide-y divide-[#2874f0]/10 overflow-hidden rounded-b-xl border border-t-0 border-[#2874f0]/25 bg-white text-left"
      >
        {products.map((product) => (
          <li key={product.href}>
            <a
              href={product.href}
              onClick={() => track(flipkart.event, { product: product.name })}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#2874f0]/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2874f0] sm:px-5"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt=""
                  width={56}
                  height={72}
                  className="h-18 w-14 shrink-0 rounded-lg bg-white object-cover object-top ring-1 ring-[#2874f0]/10"
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[#16362a]">{product.name}</span>
                {product.detail ? (
                  <span className="block text-sm text-[#16362a]/70">{product.detail}</span>
                ) : null}
              </span>
              <Arrow />
            </a>
          </li>
        ))}
        <li>
          <a
            href={flipkart.href}
            onClick={() => track(flipkart.event, { product: "All products" })}
            className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold text-[#1f63d6] transition-colors hover:bg-[#2874f0]/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2874f0]"
          >
            See all HairCraft products on Flipkart
            <Arrow />
          </a>
        </li>
      </ul>
    </details>
  );
}
