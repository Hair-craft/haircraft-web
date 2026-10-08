import type { Metadata } from "next";
import { openGraph } from "@/lib/seo/open-graph";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/seo/titles";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import {
  CategorySection,
  FaqSection,
  MostLovedSection,
  PromiseStrip,
  RangeSection,
  SectionSkeleton,
  StorySection,
  TestimonialsSection,
  TrustMarquee,
  WhySection,
} from "@/components/home/sections";
import { getNewArrivals } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { settings } from "@/lib/env";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: openGraph({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
  }),
};

/** The featured hero photo: the newest product that has one (the API being down just hides it). */
async function featuredProduct() {
  try {
    return (await getNewArrivals(8)).find((product) => product.image) ?? null;
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}

/**
 * The home page, after the two references (gemeriahair.in, 1hairstop.in).
 * The hero renders first; each data section below streams in on its own,
 * so a slow or failing section never holds up (or blanks) the page.
 */
export default async function HomePage() {
  const featured = await featuredProduct();
  return (
    <>
      <Hero featured={featured} />
      <TrustMarquee />
      <Suspense fallback={<SectionSkeleton title="Shop by category" tall />}>
        <CategorySection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton title="Most loved hair extensions" />}>
        <MostLovedSection />
      </Suspense>
      <Suspense fallback={null}>
        <WhySection />
      </Suspense>
      <Suspense fallback={null}>
        <RangeSection />
      </Suspense>
      <PromiseStrip freeShippingThreshold={settings().freeShippingThreshold} />
      <Suspense fallback={null}>
        <StorySection />
      </Suspense>
      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>
      <FaqSection />
    </>
  );
}
