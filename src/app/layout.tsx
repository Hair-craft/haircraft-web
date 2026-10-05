import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
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

/** The public site address used in metadata and structured data. */
const siteUrl = "https://haircraft.in";
const description =
  "HairCraft (Hair Craft): premium hair extensions, wigs and ponytails, crafted for length, volume and confidence.";

/** Defaults for every page; each page sets its own title and description. */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "HairCraft — Premium Hair Extensions", template: "%s | HairCraft" },
  description,
  applicationName: "HairCraft",
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "HairCraft",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/images/logo.png", width: 1240, height: 1088, alt: "HairCraft logo" }],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HairCraft",
    alternateName: ["Hair Craft", "haircraft.in"],
    url: `${siteUrl}/`,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HairCraft",
    alternateName: "Hair Craft",
    url: `${siteUrl}/`,
    logo: `${siteUrl}/images/logo.png`,
    description,
  },
];

export const viewport: Viewport = {
  themeColor: "#edf9e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
