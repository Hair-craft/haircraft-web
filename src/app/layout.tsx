import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { settings } from "@/lib/env";
import { siteJsonLd } from "@/lib/seo/organization";
import { jsonLdScript } from "@/lib/seo/json-ld";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const description =
  "HairCraft (Hair Craft): premium hair extensions, wigs and ponytails, crafted for length, volume and confidence.";

/**
 * Defaults for every page; each page sets its own title and description. The
 * site address and indexing come from the settings, so a test or preview copy
 * is never indexed (ALLOW_INDEXING=true on the live site only).
 */
export function generateMetadata(): Metadata {
  const { siteUrl, allowIndexing, googleSiteVerification, bingSiteVerification } = settings();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: "HairCraft — Premium Hair Extensions", template: "%s | HairCraft" },
    description,
    applicationName: "HairCraft",
    robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { siteName: "HairCraft", locale: "en_IN", type: "website" },
    twitter: { card: "summary_large_image" },
    verification: {
      ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
      ...(bingSiteVerification ? { other: { "msvalidate.01": bingSiteVerification } } : {}),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#edf9e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(siteJsonLd(settings().siteUrl, description)),
          }}
        />
        {children}
      </body>
    </html>
  );
}
