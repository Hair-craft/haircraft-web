import type { Metadata } from "next";
import { openGraph } from "@/lib/seo/open-graph";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/seo/titles";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import {
  CategorySection,
  ConsultSection,
  MatchSection,
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
 * The home page, after the owner's design (2026-10-31): hero, find your
 * match, categories, bestsellers, a real review, why HairCraft, WhatsApp
 * advice, then our story beside the FAQ. The hero renders first; each data
 * section streams in on its own, so a slow or failing section never holds
 * up (or blanks) the page.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={null}>
        <MatchSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton title="Shop by category" tall />}>
        <CategorySection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton title="Bestsellers & customer favourites" />}>
        <MostLovedSection />
      </Suspense>
      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>
      <WhySection />
      <ConsultSection />
      <StoryFaqSection />
    </>
  );
}
