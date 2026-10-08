import { business } from "@/content/business";
import { returnPolicy } from "./commerce";

/** The site and the business, on every page (the social profiles once the owner gives them). */
export function siteJsonLd(siteUrl: string, description: string) {
  const home = new URL("/", siteUrl).toString();
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: business.tradingName,
      alternateName: ["Hair Craft", "haircraft.in"],
      url: home,
    },
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: business.tradingName,
      ...(business.legalName ? { legalName: business.legalName } : {}),
      alternateName: "Hair Craft",
      url: home,
      logo: new URL("/images/logo.png", siteUrl).toString(),
      description,
      email: business.email,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: business.email,
        ...(business.phone ? { telephone: business.phone } : {}),
        areaServed: "IN",
        availableLanguage: ["en"],
      },
      hasMerchantReturnPolicy: returnPolicy(siteUrl),
      ...(business.socialProfiles.length > 0 ? { sameAs: business.socialProfiles } : {}),
    },
  ];
}
