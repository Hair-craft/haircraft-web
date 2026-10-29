/**
 * The home page's fixed photos (they don't change when products are added):
 * the hero, the four "Why HairCraft" cards and Our story. The files are in
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

/** One per "Why HairCraft" card, in the cards' order. */
export const whyImages: HomeImage[] = [
  {
    src: "/images/home/why-1.webp",
    alt: "A HairCraft crown topper held up to show its silk base and built-in clips",
  },
  {
    src: "/images/home/why-2.webp",
    alt: "A HairCraft silk base crown hair topper in natural black",
  },
  {
    src: "/images/home/why-3.webp",
    alt: "A HairCraft silk base hair topper with a fringe",
  },
  {
    src: "/images/home/why-4.webp",
    alt: "A HairCraft butterfly hair topper held up to show its base and clips",
  },
];

export const storyImage: HomeImage = {
  src: "/images/home/story.webp",
  alt: "A smiling woman wearing a long, wavy, warm brown HairCraft wig",
};
