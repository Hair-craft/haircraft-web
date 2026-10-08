import type { Faq } from "./faq";
import { shopLinks as l } from "./shop-links";
import type { InfoSection } from "./types";

/**
 * DRAFT — OWNER TO CONFIRM: the buying guide under each category's products
 * (S15b), keyed by the category's slug. A sub-category without its own guide
 * shows its parent's; a category with none shows just its products.
 */
export interface CategoryGuide {
  /** "Buying guide: clip-in extensions". */
  heading: string;
  intro: string;
  sections: InfoSection[];
  faqs: Faq[];
  /** Related hair guides (slugs). */
  guides: string[];
}

const clipIns: CategoryGuide = {
  heading: "Buying guide: clip-in hair extensions",
  intro:
    "Clip-in extensions add length and volume in minutes, and come out at night. Ours are 100% human hair, so they blend with your own and can be washed, curled and straightened.",
  sections: [
    {
      id: "who",
      heading: "Who clip-ins suit",
      blocks: [
        "Clip-ins suit almost every hair type: fine hair that needs volume, short hair that wants length, or thick hair for a fuller, longer look for an occasion. They're the easiest way to try extensions, with no salon visit and nothing left in overnight.",
      ],
    },
    {
      id: "choose",
      heading: "Choosing length and shade",
      blocks: [
        {
          list: [
            "Choose a length 2–6 inches longer than your own hair for a natural blend.",
            "Match the shade to your mid-lengths and ends, in daylight.",
            "Match your texture: straight, body wave or curly.",
            "[Seamless clip-ins](" +
              l.seamlessClipIns +
              ") have thin silicone wefts that lie flatter, which helps on fine hair.",
          ],
        },
      ],
    },
    {
      id: "wear",
      heading: "Wearing and caring for them",
      blocks: [
        "Section your hair, clip the widest wefts at the back first, then fill in the sides. Wash them every 15–20 wears with a sulphate-free shampoo, and store them flat and dry.",
      ],
    },
  ],
  faqs: [
    {
      question: "Will clip-ins damage my hair?",
      answer:
        "Worn correctly (clipped close to the root on dry hair, and taken out before sleeping), clip-ins don't damage your hair. Avoid clipping onto the same spot every day if your hair is very fine.",
    },
    {
      question: "Can I wear clip-ins every day?",
      answer:
        "Yes. Give your scalp a break now and then, and take them out before you sleep. For every-day wear with nothing to put in, tape-ins may suit you better: see [clip-in vs tape-in vs topper](" +
        l.guide("clip-in-vs-tape-in-vs-topper") +
        ").",
    },
    {
      question: "How long do clip-in extensions last?",
      answer:
        "With gentle care, human hair clip-ins last many months. How long depends on how often you wear, wash and heat-style them.",
    },
  ],
  guides: [
    "how-to-choose-hair-extensions",
    "clip-in-vs-tape-in-vs-topper",
    "how-to-care-for-human-hair-extensions",
  ],
};

const toppers: CategoryGuide = {
  heading: "Buying guide: hair toppers for women",
  intro:
    "A hair topper covers thinning on top (a widening parting or less volume at the crown) and blends with your own hair. Ours are 100% human hair, on bases that look natural at the parting.",
  sections: [
    {
      id: "who",
      heading: "Who toppers suit",
      blocks: [
        "Toppers suit women with thinning at the parting or crown, after pregnancy, stress, illness or with age, and anyone with fine, flat hair on top. If hair loss is sudden or patchy, see a dermatologist first: a topper covers thinning, it doesn't treat it.",
      ],
    },
    {
      id: "choose",
      heading: "Choosing a topper",
      blocks: [
        {
          list: [
            "**Base size:** measure the thinning area and add about 1 cm all round. A 12×12 cm base covers thinning across the top.",
            "**Base type:** silk looks like scalp at the parting; lace is lighter and cooler.",
            "**Fringe:** a topper with fringes also covers a thinning front hairline.",
            "**Shade and length:** match your roots and mid-lengths, in daylight.",
          ],
        },
      ],
    },
    {
      id: "wear",
      heading: "Wearing and caring for it",
      blocks: [
        "Clip the front first, then the sides and back, onto healthy hair just outside the thinning area. Wash every 10–15 wears and keep it on a stand so the base holds its shape.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is a hair topper the same as a hair patch?",
      answer:
        "Yes: topper, hair patch and top piece usually mean the same thing, a piece that covers the top of the head and clips onto your own hair.",
    },
    {
      question: "Will people be able to tell I'm wearing a topper?",
      answer:
        "A well-matched topper is very hard to spot: the base looks like scalp at the parting, and the hair blends with yours. Matching the shade and having a stylist blend the ends makes the biggest difference.",
    },
    {
      question: "Can I style a human hair topper?",
      answer:
        "Yes. You can wash, blow-dry, curl and straighten it like your own hair, with a heat protectant. A stylist can trim the fringe to suit your face.",
    },
  ],
  guides: [
    "hair-toppers-for-thinning-hair",
    "clip-in-vs-tape-in-vs-topper",
    "how-to-care-for-human-hair-extensions",
  ],
};

const wigs: CategoryGuide = {
  heading: "Buying guide: human hair wigs",
  intro:
    "A wig changes your length, texture and style at once, or gives full coverage when you need it. Ours are 100% human hair, so they look and move naturally and can be styled with heat.",
  sections: [
    {
      id: "who",
      heading: "Who wigs suit",
      blocks: [
        "Wigs suit anyone who wants a complete change of look, protection for their own hair, or full coverage during hair loss. A [lace front wig](" +
          l.laceFrontWigs +
          ") gives a natural-looking hairline you can wear off the face.",
      ],
    },
    {
      id: "choose",
      heading: "Choosing a wig",
      blocks: [
        {
          list: [
            "**Lace:** HD lace at the front melts into the skin for a natural hairline.",
            "**Density:** higher density means fuller hair; 150–180% looks full but natural.",
            "**Length and texture:** pick the look you want; human hair can be cut and styled to suit you.",
            "**Cap size:** measure around your head at the hairline; most wigs have adjustable straps.",
          ],
        },
      ],
    },
    {
      id: "care",
      heading: "Caring for a wig",
      blocks: [
        "Wash every 10–15 wears, condition the lengths (not the lace), air-dry on a stand and store it on a stand or in its box.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can I wear a human hair wig every day?",
      answer:
        "Yes. Take it off at night, keep it on a stand, and wash it every 10–15 wears. Many people keep two and alternate, so each lasts longer.",
    },
    {
      question: "Can I return a wig?",
      answer:
        "For hygiene reasons, wigs that have been tried on without their protective cap or worn can't be returned. Damaged or wrong items are always put right. See [Returns & refunds](" +
        l.returns +
        ").",
    },
    {
      question: "Can I colour a human hair wig?",
      answer:
        "A professional colourist can tone or darken it. We don't recommend lightening, which weakens the hair.",
    },
  ],
  guides: ["how-to-choose-hair-extensions", "how-to-care-for-human-hair-extensions"],
};

const ponytails: CategoryGuide = {
  heading: "Buying guide: ponytail extensions",
  intro:
    "A ponytail extension gives you a long, full ponytail in seconds: wrapped round your own ponytail, or held with a claw clip. Ours are 100% human hair, so they swing and style like your own.",
  sections: [
    {
      id: "types",
      heading: "Wrap-around or claw clip?",
      blocks: [
        {
          list: [
            "**Wrap-around:** clips into your own ponytail, then a strand of hair wraps round to hide the band. Sleek and secure.",
            "**Claw clip:** a built-in claw holds it over your ponytail or bun. The quickest to put on.",
          ],
        },
      ],
    },
    {
      id: "choose",
      heading: "Choosing length and texture",
      blocks: [
        "A ponytail sits higher than your own lengths, so you can go longer than with clip-ins. Match the shade to your hair near the ponytail, and the texture to how you usually wear it: sleek and straight, or wavy.",
      ],
    },
    {
      id: "wear",
      heading: "Wearing it",
      blocks: [
        "Make a tight ponytail with your own hair, attach the extension, and smooth any bumps. For weddings and parties, see our [wedding hair guide](" +
          l.guide("wedding-hair-length-and-volume") +
          ").",
      ],
    },
  ],
  faqs: [
    {
      question: "Does a ponytail extension work on short hair?",
      answer:
        "If your hair can be tied into a small ponytail, yes. A claw-clip ponytail can also sit over a small bun.",
    },
    {
      question: "Will it stay in all day?",
      answer:
        "Attached to a tight ponytail, it stays secure for a full day or evening. For dancing, add a couple of pins.",
    },
    {
      question: "How do I wash a ponytail extension?",
      answer:
        "Like other human hair extensions: every 15–20 wears, gently, with sulphate-free shampoo. See the [care guide](" +
        l.guide("how-to-care-for-human-hair-extensions") +
        ").",
    },
  ],
  guides: ["wedding-hair-length-and-volume", "how-to-care-for-human-hair-extensions"],
};

/** By category slug (the catalogue's; see `shop-links.ts`). */
export const CATEGORY_GUIDES: Record<string, CategoryGuide> = {
  "clip-in-extensions": clipIns,
  "toppers-on-head": toppers,
  toppers,
  wigs,
  ponytails,
};

/** The guide for a category, or its nearest parent's, or null. */
export function categoryGuide(slugs: string[]): CategoryGuide | null {
  for (const slug of slugs) if (CATEGORY_GUIDES[slug]) return CATEGORY_GUIDES[slug];
  return null;
}
