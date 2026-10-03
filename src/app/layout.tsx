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

const siteUrl = "https://haircraft.in";
const title = "HairCraft — Premium Hair Extensions | Coming Soon";
const description =
  "HairCraft (Hair Craft) brings premium hair extensions, crafted for length, volume and confidence. Our online store at haircraft.in is launching soon.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "HairCraft",
  keywords: ["HairCraft", "Hair Craft", "haircraft.in", "hair extensions", "hair extensions India"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "HairCraft",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/images/logo.png", width: 1240, height: 1088, alt: "HairCraft logo" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/images/logo.png"],
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
