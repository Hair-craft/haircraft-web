"use client";

import { gsap } from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { productHref } from "@/components/product/product-card";
import type { FeaturedReview } from "@/lib/api/catalog";
import {
  bounceTransforms,
  fanLayout,
  pushedTransform,
  reviewCardPicture,
  reviewDate,
  straightTransform,
} from "@/lib/home/bounce-cards";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PHONE = "(max-width: 639px)";

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

/**
 * Real reviews as React Bits' "Bounce Cards" (owner, 2026-11-23): up to 8
 * cards in a fanned stack, each turned a little, that pop in one after another
 * with an elastic bounce when the section comes into view. Hovering a card
 * straightens it, brings it to the front and pushes the others aside. Each
 * card's front is its photo, filling the card; clicking (or tapping) the card
 * flips it over to the customer's review, and clicking again flips it back.
 */
export function ReviewBounceCards({ reviews }: { reviews: FeaturedReview[] }) {
  const box = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [phone, setPhone] = useState(false);
  const layout = fanLayout(phone, reviews.length);
  const transforms = bounceTransforms(reviews.length, layout.step);
  const [lifted, setLifted] = useState<number | null>(null);
  const [flipped, setFlipped] = useState<number | null>(null);

  // Phones get a tighter fan so all the cards fit.
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // A new layout: each card back to its place in the fan.
  useEffect(() => {
    cards.current.forEach((card, i) => {
      if (!card) return;
      gsap.killTweensOf(card, "transform");
      gsap.set(card, { transform: transforms[i] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the fan changes only with the layout.
  }, [phone, reviews.length]);

  // The bounce-in (React Bits: scale 0 → 1, stagger 0.06, elastic.out(1, 0.8), 0.5 s delay),
  // played when the cards first come into view.
  useEffect(() => {
    const element = box.current;
    // The pop runs on an inner layer, so each card keeps its own turn and offset.
    const all = cards.current.map((card) => card?.firstElementChild).filter(Boolean);
    if (!element || reducedMotion() || typeof IntersectionObserver === "undefined") return;
    gsap.set(all, { scale: 0 });
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        gsap.to(all, { scale: 1, stagger: 0.06, ease: "elastic.out(1, 0.8)", delay: 0.5 });
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      gsap.killTweensOf(all);
      gsap.set(all, { clearProps: "scale" });
    };
  }, []);

  // React Bits' hover: the card straightens, its neighbours are pushed aside
  // (further ones a little later), all with back.out(1.4) over 0.4 s.
  const lift = (index: number | null) => {
    setLifted(index);
    // Another card coming forward turns the flipped one back to its photo.
    if (index !== flipped) setFlipped(null);
    if (reducedMotion()) return;
    cards.current.forEach((card, i) => {
      if (!card) return;
      gsap.killTweensOf(card, "transform");
      const base = transforms[i];
      const transform =
        index === null
          ? base
          : i === index
            ? straightTransform(base)
            : pushedTransform(base, i < index ? -layout.push : layout.push);
      gsap.to(card, {
        transform,
        duration: 0.4,
        ease: "back.out(1.4)",
        delay: index === null || i === index ? 0 : Math.abs(index - i) * 0.05,
        overwrite: "auto",
      });
    });
  };

  const flip = (index: number) => {
    if (lifted !== index) lift(index);
    setFlipped((now) => (now === index ? null : index));
  };

  return (
    <div ref={box} className="hc-bounce" onMouseLeave={() => lift(null)}>
      <ul className="hc-bounce__deck" aria-label="Customer reviews">
        {reviews.map((featured, i) => {
          const { review, product } = featured;
          const picture = reviewCardPicture(featured);
          const isFlipped = flipped === i;
          return (
            <li
              key={review.id}
              ref={(el) => {
                cards.current[i] = el;
              }}
              className="hc-bounce__card"
              data-lifted={lifted === i || undefined}
              style={{ transform: transforms[i] }}
              onMouseEnter={() => lift(i)}
              onFocus={() => lifted !== i && lift(i)}
              onClick={(event) => {
                // A click anywhere on the card flips it (its buttons and the product link do their own thing).
                if (!(event.target as Element).closest("a, button")) flip(i);
              }}
            >
              <div className="hc-bounce__pop">
                <div className="hc-flip" data-flipped={isFlipped || undefined}>
                  {/* Front: the photo, filling the card (owner, 2026-11-23). */}
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
                        onClick={() => flip(i)}
                        aria-label={`Read ${review.reviewerName}'s review of ${product.name}`}
                        className="mt-1 text-[0.65rem] font-bold tracking-wider uppercase underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-white"
                      >
                        Tap to read ↻
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
                      <span className="block text-xs text-muted">
                        {reviewDate(review.createdAt)}
                      </span>
                      <Link
                        href={productHref(product.slug)}
                        className="text-xs text-gold-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
                      >
                        {product.name}
                      </Link>
                    </figcaption>
                    <button
                      type="button"
                      onClick={() => flip(i)}
                      className="self-start text-[0.65rem] font-bold tracking-wider text-deep uppercase underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
                    >
                      ↺ Back to photo
                    </button>
                  </figure>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
