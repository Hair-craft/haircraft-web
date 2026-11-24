"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { productHref } from "@/components/product/product-card";
import type { FeaturedReview } from "@/lib/api/catalog";
import { cardTilt, reviewCardPicture, reviewDate } from "@/lib/home/review-cards";

function Stars({ rating, dim = "rgb(11 41 26 / 0.18)" }: { rating: number; dim?: string }) {
  return (
    <span role="img" aria-label={`Rated ${rating} out of 5`} className="flex gap-0.5">
      {/* All five: the earned ones gold, the rest dim, so 1 star reads as 1 of 5 (owner, 2026-11-23). */}
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={15}
          height={15}
          aria-hidden
          fill={i < rating ? "var(--gold)" : dim}
        >
          <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
        </svg>
      ))}
    </span>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

/**
 * Real reviews as tilted cards in a row that slides sideways (owner, 2026-11-24:
 * "we just need the tilted cards design only, not the bounced card design, and it
 * will be horizontally slide, there is no limit of 8, and when we hover the card
 * will rotate automatically"). Every review the admin chose is shown. Swipe,
 * scroll or use the arrows to slide. Each card's front is its photo; hovering a
 * card turns it over to the customer's review and it turns back when the pointer
 * leaves. On phones a tap turns it; keyboards use the "Read review" button.
 */
export function ReviewTiltCards({ reviews }: { reviews: FeaturedReview[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const canHover = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      canHover.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Which arrows make sense: none past the start or the end of the row.
  useEffect(() => {
    const row = track.current;
    if (!row) return;
    const update = () =>
      setEdges({
        start: row.scrollLeft <= 4,
        end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 4,
      });
    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reviews.length]);

  /** Slides by the whole cards that fit on the screen. */
  const slide = (direction: -1 | 1) => {
    const row = track.current;
    if (!row) return;
    const card = row.querySelector("li");
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const step = card ? card.getBoundingClientRect().width + gap : row.clientWidth * 0.8;
    const cards = Math.max(1, Math.floor(row.clientWidth / step));
    row.scrollBy({ left: direction * cards * step, behavior: "smooth" });
  };

  const toggle = (index: number) => setFlipped((now) => (now === index ? null : index));

  return (
    <div className="hc-tilt">
      <ul ref={track} className="hc-tilt__track" aria-label="Customer reviews">
        {reviews.map((featured, i) => {
          const { review, product } = featured;
          const picture = reviewCardPicture(featured);
          const isFlipped = flipped === i;
          return (
            <li
              key={review.id}
              className="hc-tilt__card"
              data-flipped={isFlipped || undefined}
              style={{ "--tilt": `${cardTilt(i)}deg` } as CSSProperties}
              onMouseEnter={() => {
                if (canHover.current) setFlipped(i);
              }}
              onMouseLeave={() => {
                if (canHover.current) setFlipped((now) => (now === i ? null : now));
              }}
              onClick={(event) => {
                // Phones: a tap turns the card (its buttons and the product link do their own thing).
                if (!canHover.current && !(event.target as Element).closest("a, button")) toggle(i);
              }}
            >
              <div className="hc-flip" data-flipped={isFlipped || undefined}>
                {/* Front: the photo, filling the card. */}
                <div className="hc-flip__face" inert={isFlipped}>
                  {picture ? (
                    <Image
                      src={picture.src}
                      alt={picture.alt}
                      fill
                      sizes="15rem"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-sand" />
                  )}
                  <div className="hc-flip__caption">
                    <Stars rating={review.rating} dim="rgb(255 255 255 / 0.4)" />
                    <p className="mt-1 truncate text-sm font-semibold">{review.reviewerName}</p>
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      aria-label={`Read ${review.reviewerName}'s review of ${product.name}`}
                      className="mt-1 text-[0.65rem] font-bold tracking-wider uppercase underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-white"
                    >
                      Read review ↻
                    </button>
                  </div>
                </div>
                {/* Back: the customer's review. */}
                <figure
                  className="hc-flip__face hc-flip__face--back flex flex-col gap-2 bg-cream p-4"
                  inert={!isFlipped}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Stars rating={review.rating} />
                    {review.verifiedPurchase ? (
                      <span className="rounded-full bg-sage px-2 py-0.5 text-[0.6rem] font-bold tracking-wider text-sage-ink uppercase">
                        Verified
                      </span>
                    ) : null}
                  </div>
                  <blockquote className="min-h-0 flex-1 overflow-y-auto font-display leading-snug">
                    {review.title ? <p className="font-semibold">“{review.title}”</p> : null}
                    {review.body ? (
                      <p className="mt-1 text-sm whitespace-pre-line text-muted italic">
                        {review.body}
                      </p>
                    ) : null}
                  </blockquote>
                  <figcaption className="text-sm">
                    <span className="block font-semibold">{review.reviewerName}</span>
                    <span className="block text-xs text-muted">{reviewDate(review.createdAt)}</span>
                    <Link
                      href={productHref(product.slug)}
                      className="text-xs text-gold-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
                    >
                      {product.name}
                    </Link>
                  </figcaption>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="self-start text-[0.65rem] font-bold tracking-wider text-deep uppercase underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
                  >
                    ↺ Back to photo
                  </button>
                </figure>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="hc-tilt__arrows">
        <button
          type="button"
          onClick={() => slide(-1)}
          disabled={edges.start}
          aria-label="Previous reviews"
        >
          <Arrow dir="left" />
        </button>
        <button
          type="button"
          onClick={() => slide(1)}
          disabled={edges.end}
          aria-label="More reviews"
        >
          <Arrow dir="right" />
        </button>
      </div>
    </div>
  );
}
