import Image from "next/image";
import Link from "next/link";
import { business } from "@/content/business";
import { INFO_PAGES } from "@/content/pages";
import { socialName } from "@/lib/info/social";
import { getCategories } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { categoryNav, routes } from "./nav";

const link = (slug: string) => {
  const page = INFO_PAGES.find((p) => p.slug === slug)!;
  return { label: page.label, href: page.href };
};
const help = ["shipping", "returns", "faq", "contact"].map(link);
const company = ["about", "privacy", "terms"].map(link);

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

export async function Footer() {
  const categories = await categoryLinks();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-deep text-mint">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Image
            src="/images/logo.png"
            alt="HairCraft"
            width={73}
            height={64}
            className="h-16 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mint/80">
            Premium hair extensions, wigs and ponytails, crafted for length, volume and confidence.
          </p>
          <p className="mt-6 text-xs tracking-wide text-mint/60 uppercase">
            Secure payments · UPI · Cards · Net banking · Wallets
          </p>
          {business.socialProfiles.length > 0 ? (
            <ul
              aria-label="HairCraft on social media"
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm"
            >
              {business.socialProfiles.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="text-mint/85 hover:text-mint hover:underline focus-visible:outline-2 focus-visible:outline-mint"
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
          title="Shop"
          links={[
            { label: "All products", href: routes.shop },
            ...categories,
            { label: "Hair guides", href: "/guides" },
            { label: "Search", href: routes.search },
          ]}
        />
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-1">
          <FooterLinks title="Help" links={help} />
          <FooterLinks title="HairCraft" links={company} />
        </div>
      </div>
      <div className="border-t border-mint/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-mint/60 sm:px-6">
          © {year} HairCraft. All prices in Indian rupees, GST included.
        </p>
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
      <h2 className="font-display text-lg text-gold-light">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-mint/85 hover:text-mint hover:underline focus-visible:outline-2 focus-visible:outline-mint"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
