import { shopLinks as l } from "../shop-links";
import type { Guide } from "./types";

export const careGuide: Guide = {
  slug: "how-to-care-for-human-hair-extensions",
  title: "How to wash and care for human hair extensions and wigs",
  summary:
    "With the right care, human hair extensions, toppers and wigs stay soft and natural for many months. Here's how to wash, dry, style and store them.",
  updated: "2026-10-08",
  shop: [
    { label: "Clip-in extensions", href: l.clipIns },
    { label: "Wigs", href: l.wigs },
    { label: "Hair toppers", href: l.toppers },
  ],
  sections: [
    {
      id: "why",
      heading: "Why extensions need gentle care",
      blocks: [
        "Your own hair gets natural oils from your scalp. Extensions don't, so they dry out faster. Gentle washing, regular conditioning and less heat keep them soft and tangle-free for longer.",
      ],
    },
    {
      id: "how-often",
      heading: "How often to wash",
      blocks: [
        {
          list: [
            "**Clip-ins and ponytails:** every 15–20 wears, or sooner if you use a lot of styling products.",
            "**Toppers and wigs:** every 10–15 wears.",
            "**Tape-ins:** as you wash your own hair, about two or three times a week.",
          ],
        },
        "Washing too often dries the hair out, so wash when they need it, not on a schedule.",
      ],
    },
    {
      id: "wash",
      heading: "How to wash clip-ins, toppers and wigs",
      blocks: [
        {
          steps: [
            "Brush out any tangles gently, from the ends upwards.",
            "Fill a basin with lukewarm (not hot) water and a little sulphate-free shampoo.",
            "Dip the hair and swish it gently for a minute. Don't rub or twist it.",
            "Rinse in clean lukewarm water, running down the length of the hair.",
            "Apply conditioner from mid-lengths to ends, keeping it away from clips, tapes and the base. Leave for two or three minutes, then rinse well.",
            "Press out the water with a towel. Never wring it.",
            "Lay flat or hang on a stand to air-dry.",
          ],
        },
        {
          tip: "Wash wefts in the direction the hair grows (from the clip to the ends), and they'll tangle much less.",
        },
      ],
    },
    {
      id: "tape-ins",
      heading: "Washing with tape-ins in",
      blocks: [
        {
          list: [
            "Use a sulphate-free, alcohol-free shampoo.",
            "Keep conditioner, oils and serums away from the tapes: they loosen the adhesive.",
            "Dry the roots first with a cool or warm (not hot) setting.",
            "Don't sleep on wet hair; tie it in a loose braid once dry.",
          ],
        },
      ],
    },
    {
      id: "style",
      heading: "Heat styling",
      blocks: [
        "Human hair can be straightened, curled and blow-dried like your own.",
        {
          list: [
            "Always use a heat protectant spray first.",
            "Keep tools below about 180 °C, and lower for fine hair.",
            "Let the hair cool before brushing, so curls hold.",
            "Skip heat when you can: air-drying and overnight braids give waves without damage.",
          ],
        },
        "A professional colourist can tone or darken the hair. We don't recommend lightening or bleaching: it weakens the hair, and coloured or treated hair can't be returned.",
      ],
    },
    {
      id: "store",
      heading: "Storing between wears",
      blocks: [
        {
          list: [
            "Brush them out and make sure they're completely dry.",
            "Store clip-ins flat or hung, in their box or a silk or satin bag.",
            "Keep wigs and toppers on a stand so the base keeps its shape.",
            "Keep them away from sun, heat and damp.",
          ],
        },
      ],
    },
    {
      id: "everyday",
      heading: "Everyday habits that help",
      blocks: [
        {
          list: [
            "Use a soft-bristle or loop brush, starting from the ends.",
            "Sleep on a silk or satin pillowcase if you wear tape-ins.",
            "Before swimming, tie hair up; afterwards, rinse with fresh water and condition.",
            "In humid weather, a light leave-in on the ends keeps frizz down.",
          ],
        },
        "Questions about a specific product? Our [FAQ](" +
          l.faq +
          ") has more, or [contact us](" +
          l.contact +
          ").",
      ],
    },
  ],
};
