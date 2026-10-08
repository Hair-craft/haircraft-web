import { shopLinks as l } from "../shop-links";
import type { Guide } from "./types";

export const hairToppers: Guide = {
  slug: "hair-toppers-for-thinning-hair",
  title: "Hair toppers for thinning hair: a complete guide for women",
  summary:
    "A widening parting or thinner hair at the crown is common, and a human hair topper can cover it in minutes. Here's how toppers work, who they suit, and how to choose one.",
  updated: "2026-10-08",
  shop: [
    { label: "Hair toppers", href: l.toppers },
    { label: "Clip-in extensions", href: l.clipIns },
  ],
  sections: [
    {
      id: "what",
      heading: "What is a hair topper?",
      blocks: [
        "A hair topper (sometimes called a hair patch or top piece) is a small base with human hair attached. It clips onto your own hair on top of your head, covering the parting and crown, and blends into your hair around it.",
        "Unlike a wig, it only covers the area you want to cover, so it's lighter, cooler and quicker to put on.",
      ],
    },
    {
      id: "who",
      heading: "Who toppers suit",
      blocks: [
        {
          list: [
            "**A widening parting** or scalp showing through on top.",
            "**Thinning at the crown**, for example after pregnancy, illness, stress or with age.",
            "**Fine, flat hair** that won't hold volume on top.",
            "**Anyone** who wants more fullness on top without extensions at the back.",
          ],
        },
        "Hair loss has many causes. If yours is sudden, patchy or getting worse, see a dermatologist first: a topper covers thinning, it doesn't treat it.",
      ],
    },
    {
      id: "base",
      heading: "Choosing the base",
      blocks: [
        "The base is the part that sits on your head. Its size and material decide how natural the topper looks.",
        {
          list: [
            "**Size:** measure the thinning area front to back and side to side, and choose a base that covers it with about 1 cm to spare. A **12×12 cm** base suits thinning across the top; smaller bases suit just the parting.",
            "**Silk base:** looks like scalp at the parting, so you can part the hair naturally. A good choice when the parting shows most.",
            "**Lace or mono base:** light and breathable, good for warm weather and longer wear.",
          ],
        },
        {
          tip: "Choose a base a little bigger than the thinning area. The clips need healthy hair to grip, so they should sit just outside the thinner part.",
        },
      ],
    },
    {
      id: "hair",
      heading: "Length, shade and fringe",
      blocks: [
        {
          list: [
            "**Length:** match your own hair or go slightly longer; the topper's hair should fall into your lengths.",
            "**Shade:** match your roots and mid-lengths in daylight. If your hair has grey at the parting, match the overall look rather than the darkest strands.",
            "**Fringe:** a topper with fringes (bangs) also covers a thinning hairline at the front, and frames the face.",
          ],
        },
        "Because it's human hair, you can trim, style and heat-style a topper like your own hair. A stylist can cut the fringe and blend the ends.",
      ],
    },
    {
      id: "wear",
      heading: "How to put on a topper",
      blocks: [
        {
          steps: [
            "Brush your hair and part it where you usually do.",
            "Hold the topper at the front of your hairline, slightly behind where you want it to sit.",
            "Open the front clip and press it into your hair close to the root.",
            "Smooth the topper back and fasten the side and back clips the same way.",
            "Blend: brush your own hair and the topper's hair together, and style as usual.",
          ],
        },
        "The first few times take a little practice; after a week it usually takes a minute or two.",
      ],
    },
    {
      id: "care",
      heading: "Caring for your topper",
      blocks: [
        {
          list: [
            "Wash every 10–15 wears with a gentle, sulphate-free shampoo and conditioner, keeping conditioner away from the base.",
            "Let it air-dry on a stand, never on a radiator or in direct sun.",
            "Store it on a stand or in its box, so the base keeps its shape.",
            "Brush from the ends upwards, holding the hair near the base.",
          ],
        },
        "See our full [care guide](" +
          l.guide("how-to-care-for-human-hair-extensions") +
          ") for washing and styling.",
      ],
    },
    {
      id: "help",
      heading: "Need help choosing?",
      blocks: [
        "Choosing a topper is personal. [Send us a photo](" +
          l.contact +
          ") of your parting and crown in daylight, and tell us your hair length, and we'll suggest a size and shade. You can also see [all our toppers](" +
          l.toppers +
          ").",
      ],
    },
  ],
};
