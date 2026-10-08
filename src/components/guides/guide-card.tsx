import Link from "next/link";
import { readingMinutes, type Guide } from "@/content/guides";

/** A guide on the guides page, or under "Keep reading". */
export function GuideCard({ guide, headingLevel = 2 }: { guide: Guide; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex h-full flex-col gap-3 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-deep/5 transition hover:shadow-md hover:ring-deep/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep sm:p-7"
    >
      <span aria-hidden className="h-1 w-10 rounded-full bg-gold" />
      <Heading className="font-display text-2xl leading-snug group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
        {guide.title}
      </Heading>
      <p className="flex-1 leading-relaxed text-deep/70">{guide.summary}</p>
      <p className="text-sm text-deep/70">{readingMinutes(guide)} min read</p>
    </Link>
  );
}
