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
export const heroImage: HomeImage = {
  src: "/images/home/hero-banner-6.jpg",
  alt: "A smiling HairCraft stylist holds up a dark human hair piece beside two long-haired mannequins and a HairCraft box",
};

export const storyImage: HomeImage = {
  src: "/images/home/story.webp",
  alt: "A smiling woman wearing a long, wavy, warm brown HairCraft wig",
};
