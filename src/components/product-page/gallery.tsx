"use client";

import Image from "next/image";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRightIcon, CloseIcon } from "@/components/ui/icons";
import type { ProductImage } from "@/lib/api/types";
import { cx } from "@/lib/cx";

/** The same `sizes` everywhere, so the phone row and the desktop photo share one download. */
const SIZES = "(min-width: 1024px) 50vw, 100vw";

/**
 * Product photos are taken 3:4 (portrait). Every frame here is that shape, and
 * photos are fitted, not cropped, so a photo of another shape is never cut
 * (the measuring arrows on the length photos must show end to end).
 */
const FRAME = "aspect-[3/4] bg-white";

/** What the full-screen view needs of a photo. */
export type LightboxPhoto = Pick<ProductImage, "id" | "urls" | "altText">;

const alt = (image: LightboxPhoto, name: string, i: number, total: number) =>
  image.altText ?? `${name}, photo ${i + 1} of ${total}`;

/**
 * Product photos. Desktop: a large photo with thumbnails beside it and
 * arrows. Phones: a row to swipe through, with dots. Either opens a
 * full-screen view. Re-mounted (by its key) when the option changes, so it
 * starts again from that option's first photo.
 */
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  // Photos are optional: without any, one placeholder in the photo's place.
  if (images.length === 0)
    return (
      <div className={cx("relative overflow-hidden rounded-xl", FRAME)}>
        <PhotoPlaceholder />
      </div>
    );
  return <PhotoGallery images={images} name={name} />;
}

function PhotoGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState<number | null>(null);
  const row = useRef<HTMLUListElement>(null);
  const thumbs = useRef<HTMLUListElement>(null);
  const total = images.length;

  // Keep the chosen thumbnail in view when the column of thumbnails scrolls
  // (scrolling only the column, never the page).
  useEffect(() => {
    const list = thumbs.current;
    const item = list?.children[active] as HTMLElement | undefined;
    if (!list || !item) return;
    // The list is positioned, so this is measured from its own top.
    const top = item.offsetTop;
    if (top < list.scrollTop) list.scrollTo({ top, behavior: "smooth" });
    else if (top + item.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTo({ top: top + item.offsetHeight - list.clientHeight, behavior: "smooth" });
  }, [active]);

  if (total === 0)
    return <div className="aspect-[3/4] rounded-xl bg-mint-deep" aria-label="No photo yet" />;

  const show = (i: number) => setActive((i + total) % total);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") show(active + 1);
    else if (event.key === "ArrowLeft") show(active - 1);
    else return;
    event.preventDefault();
  };
  const scrollTo = (i: number) =>
    row.current?.scrollTo({ left: i * row.current.clientWidth, behavior: "smooth" });

  return (
    <div>
      {/* Desktop: the large photo, then a row of thumbnails under it. */}
      <div className="hidden flex-col gap-4 lg:flex">
        <div className="relative" onKeyDown={onKeyDown}>
          <button
            type="button"
            onClick={() => setZoomed(active)}
            aria-label={`View photo ${active + 1} of ${total} full screen`}
            className={cx(
              "relative block w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep",
              // Square, as in the design; the whole photo shows (contained) on the sand ground.
              "aspect-square bg-sand",
            )}
          >
            <Image
              key={images[active].id}
              src={images[active].urls.large}
              alt={alt(images[active], name, active, total)}
              fill
              priority={active === 0}
              sizes={SIZES}
              className="hc-fade-in object-contain"
            />
          </button>
          {total > 1 ? (
            <>
              <Arrow direction="previous" onClick={() => show(active - 1)} />
              <Arrow direction="next" onClick={() => show(active + 1)} />
            </>
          ) : null}
        </div>
        <div>
          <ul ref={thumbs} aria-label="Photos" className="grid grid-cols-5 gap-3 p-0.5">
            {images.map((image, i) => (
              <li key={image.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => show(i)}
                  aria-label={`Photo ${i + 1} of ${total}`}
                  aria-current={i === active || undefined}
                  className={cx(
                    "relative block aspect-square w-full overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-2 transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-deep",
                    i === active ? "ring-deep" : "opacity-80 ring-transparent hover:opacity-100",
                  )}
                >
                  <Image
                    src={image.urls.thumbnail}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Phones: edge to edge. Tablets: a centred photo, not one taller than the screen. */}
      <div className="sm:mx-auto sm:max-w-md lg:hidden">
        <ul
          ref={row}
          aria-label="Photos"
          onScroll={(event) => {
            const el = event.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="relative -mx-4 flex snap-x snap-mandatory overflow-x-auto sm:mx-0 sm:rounded-xl [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, i) => (
            <li key={image.id} className="w-full shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setZoomed(i)}
                aria-label={`View photo ${i + 1} of ${total} full screen`}
                className={cx("relative block w-full", FRAME)}
              >
                <Image
                  src={image.urls.large}
                  alt={alt(image, name, i, total)}
                  fill
                  priority={i === 0}
                  sizes={SIZES}
                  className="object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
        {total > 1 ? (
          <div className="mt-1 flex justify-center">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Photo ${i + 1} of ${total}`}
                aria-current={i === active || undefined}
                // A 24 px target (WCAG 2.2) around the small dot people see.
                className="group flex h-6 min-w-6 items-center justify-center px-1"
              >
                <span
                  aria-hidden
                  className={cx(
                    "h-2 rounded-full transition-all",
                    i === active ? "w-6 bg-deep" : "w-2 bg-deep/25 group-hover:bg-deep/50",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {zoomed !== null ? (
        <Lightbox images={images} name={name} start={zoomed} onClose={() => setZoomed(null)} />
      ) : null}
    </div>
  );
}

function Arrow({ direction, onClick }: { direction: "previous" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "next" ? "Next photo" : "Previous photo"}
      className={cx(
        "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur hover:bg-white focus-visible:outline-2 focus-visible:outline-deep",
        direction === "next" ? "right-4" : "left-4",
      )}
    >
      <ChevronRightIcon
        width={20}
        height={20}
        className={direction === "previous" ? "rotate-180" : ""}
      />
    </button>
  );
}

/** Full-screen photos: swipe or use the arrows; Escape or × closes. */
export function Lightbox({
  images,
  name,
  start,
  onClose,
}: {
  images: LightboxPhoto[];
  name: string;
  start: number;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const row = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(start);
  const total = images.length;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    document.documentElement.style.overflow = "hidden";
    // Jump (not glide) to the photo that was clicked.
    row.current?.scrollTo({ left: start * row.current.clientWidth });
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [start]);

  const go = (i: number) => {
    const next = (i + total) % total;
    row.current?.scrollTo({ left: next * row.current.clientWidth, behavior: "smooth" });
  };

  return (
    <dialog
      ref={dialog}
      aria-label={`${name}: photos`}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1);
        else if (event.key === "ArrowLeft") go(index - 1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-deep p-0 text-white backdrop:bg-deep"
    >
      <p className="absolute top-5 left-5 z-10 text-sm tracking-[0.2em]" aria-live="polite">
        {index + 1} / {total}
      </p>
      <button
        type="button"
        onClick={() => dialog.current?.close()}
        aria-label="Close photos"
        className="absolute top-3 right-3 z-10 rounded-full p-3 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-mint"
      >
        <CloseIcon />
      </button>
      <ul
        ref={row}
        onScroll={(event) => {
          const el = event.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        // Focusable, so the photos can be scrolled with the keyboard too.
        tabIndex={0}
        aria-label={`Photos of ${name}`}
        className="flex h-full snap-x snap-mandatory overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <li key={image.id} className="relative h-full w-screen shrink-0 snap-center">
            <Image
              src={image.urls.original}
              alt={alt(image, name, i, total)}
              fill
              sizes="100vw"
              className="object-contain p-4 sm:p-12"
            />
          </li>
        ))}
      </ul>
      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
            className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:flex"
          >
            <ChevronRightIcon width={22} height={22} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
            className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:flex"
          >
            <ChevronRightIcon width={22} height={22} />
          </button>
        </>
      ) : null}
    </dialog>
  );
}
