import type { Metadata } from "next";
import { openGraph } from "@/lib/seo/open-graph";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/seo/titles";
import { Suspense } from "react";
import { Hero, HeroShutterPanel } from "@/components/home/hero";
import {
  BestSellersSection,
  CategorySection,
  ConcernSection,
  ConsultSection,
  MostLovedSection,
  SectionSkeleton,
  StoryFaqSection,
  TestimonialsSection,
  WhySection,
} from "@/components/home/sections";

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

/**
 * The home page, after the owner's design (2026-10-31, updated 2026-11-03):
 * hero, shop by concern, best sellers, categories, customer favourites, a
 * real review, why HairCraft, WhatsApp advice, then our story beside the FAQ. The hero renders first; each data
 * section streams in on its own, so a slow or failing section never holds
 * up (or blanks) the page.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <HeroShutterPanel>
        <Suspense fallback={null}>
          <ConcernSection />
        </Suspense>
        <Suspense fallback={null}>
          <BestSellersSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="Shop by category" tall />}>
          <CategorySection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="Customer favourites" />}>
          <MostLovedSection />
        </Suspense>
        <Suspense fallback={null}>
          <TestimonialsSection />
        </Suspense>
        <WhySection />
        <ConsultSection />
        <StoryFaqSection />
      </HeroShutterPanel>
    </>
  );
}
