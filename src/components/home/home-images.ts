/**
 * The home page's fixed photos (they don't change when products are added):
 * the hero banner and Our story. The files are in `public/images/home/`; to
 * change a photo, replace its file and its description here.
 */
export interface HomeImage {
  src: string;
  alt: string;
}

/**
 * The hero banner (owner, 2026-11-20): a wide photo (2240 × 1260, the owner's file as is, so it stays sharp) with open
 * cream space on the left, where the words sit, and the people on the right.
 * To change it, replace the file with another wide photo laid out the same
 * way (the section's cream, #fbf6f2 in hero.tsx, matches its background).
 */
export const heroImage: HomeImage & { mobile: string } = {
  // The owner's "Blog Banner for Website Content" desktop and mobile files (2026-11-24),
  // 2240 × 1260 each, used as the SVGs themselves (owner, 2026-11-24): the desktop one from
  // tablets up, the mobile one on phones.
  src: "/images/home/hero-banner-desktop.svg",
  mobile: "/images/home/hero-banner-mobile.svg",
  alt: "A smiling HairCraft stylist holds up a dark human hair piece beside two long-haired mannequins and a HairCraft box",
};

/**
 * The hero's slides, in the order they play (owner, 2026-11-26: "multiple slide show
 * banners ... make them size wise"): each with its own computer and phone picture, the
 * owner's SVGs as they are. The admin only shows or hides them (no uploads); the keys
 * match the API's.
 */
export const heroSlides = [
  {
    key: "stylist",
    label: "Fuller hair, a more confident you",
    // The banner with the headline; its pictures are `heroImage`.
    desktop: heroImage.src,
    mobile: heroImage.mobile,
    alt: heroImage.alt,
  },
  {
    key: "toppers",
    label: "Hair toppers",
    // The owner's "2nd Blog Banner" (computers, 2240 × 1260) and "Mobile Banner" (phones,
    // owner 2026-11-27: a tall 1890 × 3780 picture with open beige space at the top).
    desktop: "/images/home/hero-toppers-desktop.svg",
    mobile: "/images/home/hero-toppers-phone.svg",
    alt: "Smiling women showing HairCraft hair toppers, the clips on their bases, and long wavy human hair",
    // Its words (owner, 2026-11-26), styled like the first banner's, at the top right.
    tagline: "Crafted for Seamless Confidence",
    headline: ["Beautifully Yours.", "Confidently You."],
  },
] as const;
export type HeroSlide = (typeof heroSlides)[number];

/**
 * The slides to show: those the admin left on, in order. Every one when the API is older
 * (it sends no list), can't be reached, or (it never should) has them all off.
 */
export function shownHeroSlides(
  settings: { key: string; shown: boolean }[] | undefined | null,
): HeroSlide[] {
  if (!settings) return [...heroSlides];
  const hidden = new Set(settings.filter((s) => !s.shown).map((s) => s.key));
  const shown = heroSlides.filter((slide) => !hidden.has(slide.key));
  return shown.length > 0 ? shown : [...heroSlides];
}

export const storyImage: HomeImage = {
  src: "/images/home/story.webp",
  alt: "A smiling woman wearing a long, wavy, warm brown HairCraft wig",
};
