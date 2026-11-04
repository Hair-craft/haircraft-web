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
 * The hero banner (owner, 2026-11-03): a wide photo (1600 × 500) with the
 * person on the left and open space on the right, where the words sit. To
 * change it, replace the file with another wide photo laid out the same way.
 */
export const heroImage: HomeImage = {
  src: "/images/home/hero-banner-2.webp",
  alt: "A HairCraft stylist smiling as she parts and combs a long, dark human hair piece on a mannequin",
};

export const storyImage: HomeImage = {
  src: "/images/home/story.webp",
  alt: "A smiling woman wearing a long, wavy, warm brown HairCraft wig",
};
