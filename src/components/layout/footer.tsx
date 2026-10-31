import Image from "next/image";
import Link from "next/link";
import { business } from "@/content/business";
import { INFO_PAGES } from "@/content/pages";
import { socialName } from "@/lib/info/social";
import { getCategories } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { whatsappChatHref } from "@/lib/info/contact";
import { categoryNav, routes } from "./nav";

const link = (slug: string) => {
  const page = INFO_PAGES.find((p) => p.slug === slug)!;
  return { label: page.label, href: page.href };
};
const help = [
  ...["shipping", "returns", "faq", "contact"].map(link),
  { label: "Hair guides", href: "/guides" },
  { label: "Track your order", href: "/account/orders" },
];
const company = ["about"].map(link);
/** In the bottom bar, as in the design. */
const legal = ["privacy", "terms"].map(link);

/** Top-level categories with products, for the Shop column (none if the API is down). */
async function categoryLinks(): Promise<{ label: string; href: string }[]> {
  try {
    return categoryNav(await getCategories()).map((item) => ({
      label: item.label,
      href: item.href,
    }));
  } catch (error) {
    if (isApiError(error)) return [];
    throw error;
  }
}

const payments = ["UPI", "GPay", "PhonePe", "Visa", "Mastercard", "Net banking"];

export async function Footer() {
  const categories = await categoryLinks();
  const year = new Date().getFullYear();
  const whatsapp = whatsappChatHref(business);
  return (
    <footer className="mt-auto bg-cream text-deep shadow-[0_-4px_24px_rgba(11,41,26,0.03)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-14 pb-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="HairCraft"
              width={73}
              height={64}
              className="h-10 w-auto"
            />
            <span className="flex flex-col">
              <span className="font-display text-lg font-semibold tracking-tight">HairCraft</span>
              <span className="text-[0.625rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
                Luxury Human Hair Co.
              </span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Premium hair extensions, wigs and ponytails, crafted for length, volume and confidence.
          </p>
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-sage-ink">
            <span aria-hidden className="text-gold">
              ✦
            </span>
            100% human hair
          </p>
          {business.socialProfiles.length > 0 ? (
            <ul
              aria-label="HairCraft on social media"
              className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
            >
              {business.socialProfiles.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="font-medium text-deep-soft hover:text-gold-ink hover:underline focus-visible:outline-2 focus-visible:outline-deep"
                  >
                    {socialName(url)}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <FooterLinks
          title="Quick Shop"
          links={[
            { label: "All products", href: routes.shop },
            ...categories,
            { label: "Search", href: routes.search },
          ]}
        />
        <div>
          <FooterLinks title="Customer Care & Guides" links={help} />
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-sage-ink hover:underline focus-visible:outline-2 focus-visible:outline-deep"
            >
              WhatsApp us
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
        <div className="flex flex-col gap-8">
          <FooterLinks title="HairCraft" links={company} />
          <div>
            <h2 className="text-[0.65rem] font-bold tracking-[0.15em] text-muted uppercase">
              Secure domestic payments
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {payments.map((method) => (
                <li
                  key={method}
                  className="rounded border border-line bg-white px-2 py-1 text-xs font-semibold"
                >
                  {method}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-sm text-muted sm:px-6 md:flex-row">
          <p>© {year} HairCraft. All prices in INR, inclusive of all GST taxes.</p>
          <ul className="flex items-center gap-6">
            {legal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-deep focus-visible:outline-2 focus-visible:outline-deep"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted transition-colors hover:text-deep hover:underline focus-visible:outline-2 focus-visible:outline-deep"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
