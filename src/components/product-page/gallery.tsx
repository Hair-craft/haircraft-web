"use client";

import Image from "next/image";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRightIcon, CloseIcon } from "@/components/ui/icons";
import type { ProductImage, ProductVideo } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { HoverZoom } from "./hover-zoom";

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
 * Product photos, then videos (owner, 2026-11-06). Desktop: a large view
 * with thumbnails under it and arrows; hovering a photo zooms it. Phones: a
 * row to swipe through, with dots. Photos open a full-screen view; videos
 * play muted and looping where they are, with the player's own controls
 * (sound, full screen). Re-mounted (by its key) when the option changes, so
 * it starts again from that option's first photo.
 */
export function Gallery({
  images,
  videos = [],
  name,
}: {
  images: ProductImage[];
  videos?: ProductVideo[];
  name: string;
}) {
  // Photos are optional: without any (and no video), one placeholder in the photo's place.
  if (images.length === 0 && videos.length === 0)
    return (
      <div className={cx("relative overflow-hidden rounded-xl", FRAME)}>
        <PhotoPlaceholder />
      </div>
    );
  return <PhotoGallery images={images} videos={videos} name={name} />;
}

type Item = { kind: "photo"; image: ProductImage } | { kind: "video"; video: ProductVideo };

const itemKey = (item: Item) => (item.kind === "photo" ? item.image.id : item.video.id);
const itemLabel = (item: Item, i: number, total: number) =>
  item.kind === "photo" ? `Photo ${i + 1} of ${total}` : `Video ${i + 1} of ${total}`;

/** A video in the gallery: plays (muted, looping) only while it is the one shown. */
function VideoView({
  video,
  active,
  name,
  className,
}: {
  video: ProductVideo;
  active: boolean;
  name: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      el.play().catch(() => undefined);
    else el.pause();
  }, [active]);
  return (
    <video
      ref={ref}
      src={video.url}
      poster={video.poster.large}
      muted
      loop
      playsInline
      controls
      preload={active ? "metadata" : "none"}
      aria-label={`${name}, video (${video.durationSeconds} seconds)`}
      className={cx("size-full bg-white object-contain", className)}
    />
  );
}

function PlayBadge() {
  return (
    <span
      aria-hidden
      className="absolute inset-0 m-auto grid size-8 place-items-center rounded-full bg-deep/80 text-white shadow"
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

function PhotoGallery({
  images,
  videos,
  name,
}: {
  images: ProductImage[];
  videos: ProductVideo[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState<number | null>(null);
  const row = useRef<HTMLUListElement>(null);
  const thumbs = useRef<HTMLUListElement>(null);
  // Photos first, then videos: a photo's place is its place in `images` (for the full-screen view).
  const items: Item[] = [
    ...images.map((image) => ({ kind: "photo" as const, image })),
    ...videos.map((video) => ({ kind: "video" as const, video })),
  ];
  const total = items.length;

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
  const current = items[Math.min(active, total - 1)];

  return (
    <div>
      {/* Desktop: the large photo or video, then a row of thumbnails under it. */}
      <div className="hidden flex-col gap-4 lg:flex">
        <div className="relative" onKeyDown={onKeyDown}>
          {current.kind === "photo" ? (
            <HoverZoom key={current.image.id} src={current.image.urls.original}>
              <button
                type="button"
                onClick={() => setZoomed(active)}
                aria-label={`View photo ${active + 1} of ${total} full screen`}
                className={cx(
                  "relative block w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep",
                  // Square, as in the design; the whole photo shows (contained) on white, for a natural look.
                  "aspect-square bg-white",
                )}
              >
                <Image
                  key={current.image.id}
                  src={current.image.urls.large}
                  alt={alt(current.image, name, active, total)}
                  fill
                  priority={active === 0}
                  sizes={SIZES}
                  className="hc-fade-in object-contain"
                />
              </button>
            </HoverZoom>
          ) : (
            <div className="aspect-square overflow-hidden rounded-xl bg-white">
              <VideoView key={current.video.id} video={current.video} active name={name} />
            </div>
          )}
          {total > 1 ? (
            <>
              <Arrow direction="previous" onClick={() => show(active - 1)} />
              <Arrow direction="next" onClick={() => show(active + 1)} />
            </>
          ) : null}
        </div>
        <div>
          <ul ref={thumbs} aria-label="Photos" className="grid grid-cols-5 gap-3 p-0.5">
            {items.map((item, i) => (
              <li key={itemKey(item)} className="shrink-0">
                <button
                  type="button"
                  onClick={() => show(i)}
                  aria-label={itemLabel(item, i, total)}
                  aria-current={i === active || undefined}
                  className={cx(
                    "relative block aspect-square w-full overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-2 transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-deep",
                    i === active ? "ring-deep" : "opacity-80 ring-transparent hover:opacity-100",
                  )}
                >
                  <Image
                    src={
                      item.kind === "photo"
                        ? item.image.urls.thumbnail
                        : item.video.poster.thumbnail
                    }
                    alt=""
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                  {item.kind === "video" ? <PlayBadge /> : null}
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
          // Inside the photo card, rounded (owner, 2026-11-03: the photo fits the card on phones).
          className="relative flex snap-x snap-mandatory overflow-x-auto rounded-xl [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => (
            <li key={itemKey(item)} className="w-full shrink-0 snap-start">
              {item.kind === "photo" ? (
                <button
                  type="button"
                  onClick={() => setZoomed(i)}
                  aria-label={`View photo ${i + 1} of ${total} full screen`}
                  className={cx("relative block w-full", FRAME)}
                >
                  <Image
                    src={item.image.urls.large}
                    alt={alt(item.image, name, i, total)}
                    fill
                    priority={i === 0}
                    sizes={SIZES}
                    className="object-contain"
                  />
                </button>
              ) : (
                <div className={cx("relative w-full", FRAME)}>
                  <VideoView video={item.video} active={i === active} name={name} />
                </div>
              )}
            </li>
          ))}
        </ul>
        {total > 1 ? (
          <div className="mt-1 flex justify-center">
            {items.map((item, i) => (
              <button
                key={itemKey(item)}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={itemLabel(item, i, total)}
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

      {zoomed !== null && images.length > 0 ? (
        <Lightbox
          images={images}
          name={name}
          start={Math.min(zoomed, images.length - 1)}
          onClose={() => setZoomed(null)}
        />
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
