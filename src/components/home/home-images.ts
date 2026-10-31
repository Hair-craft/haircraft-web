/**
 * The home page's fixed photos (they don't change when products are added):
 * the hero and Our story. The files are in
 * `public/images/home/`; to change a photo, replace its file (same name,
 * portrait, about 1200 × 1600) and its description here.
 */
export interface HomeImage {
  src: string;
  alt: string;
}

export const heroImage: HomeImage = {
  src: "/images/home/hero.webp",
  alt: "A woman holding a HairCraft hair topper along her forehead to show how it fits",
};

export const storyImage: HomeImage = {
  src: "/images/home/story.webp",
  alt: "A smiling woman wearing a long, wavy, warm brown HairCraft wig",
};
