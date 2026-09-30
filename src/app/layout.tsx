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

export const metadata: Metadata = {
  title: "HairCraft — Coming Soon",
  description:
    "Premium hair extensions, crafted for you. HairCraft is launching soon.",
  openGraph: {
    title: "HairCraft — Coming Soon",
    description:
      "Premium hair extensions, crafted for you. HairCraft is launching soon.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1512",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
