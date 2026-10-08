import { shopLinks as l } from "../shop-links";
import type { Guide } from "./types";

export const chooseHairExtensions: Guide = {
  slug: "how-to-choose-hair-extensions",
  title: "How to choose hair extensions: length, shade and texture",
  summary:
    "Choosing human hair extensions online is easier than it looks. Here's how to pick the right type, length, shade and texture, so they blend with your own hair.",
  updated: "2026-10-08",
  shop: [
    { label: "Clip-in extensions", href: l.clipIns },
    { label: "Hair toppers", href: l.toppers },
    { label: "Ponytails", href: l.ponytails },
  ],
  sections: [
    {
      id: "type",
      heading: "1. Start with what you want to change",
      blocks: [
        "Every good match starts with the result you want, not the product. Ask yourself:",
        {
          list: [
            "**More length?** Clip-in extensions or tape-ins add length from the back and sides.",
            "**More volume?** A clip-in set or a ponytail adds fullness without changing your length much.",
            "**Thinner hair on top or a wider parting?** A [hair topper](" +
              l.toppers +
              ") covers the crown and parting where clip-ins can't.",
            "**A whole new look, any day?** A [wig](" +
              l.wigs +
              ") changes length, texture and style at once.",
            "**A fringe without the cut?** Clip-in bangs give you a fringe you can take off at night.",
          ],
        },
        "If you're between two types, read [clip-in vs tape-in vs topper](" +
          l.guide("clip-in-vs-tape-in-vs-topper") +
          ").",
      ],
    },
    {
      id: "length",
      heading: "2. Choose the length",
      blocks: [
        "Measure your own hair from the nape of your neck to the ends, and compare it with the extension's length.",
        {
          list: [
            "**For a seamless blend**, choose extensions 2–6 inches longer than your own hair. Bigger jumps can look obvious unless your hair is thick enough to cover the wefts.",
            "**Short hair (above the shoulders)** blends best with 14–16 inch extensions, layered and styled together.",
            "**Shoulder-length hair** blends well with 16–20 inches.",
            "**Long hair** can take 20–24 inches for real drama.",
          ],
        },
        {
          tip: "Longer isn't always better. Extensions much longer than your own hair can thin out at the ends of the blend. When in doubt, go a size shorter.",
        },
      ],
    },
    {
      id: "shade",
      heading: "3. Match the shade",
      blocks: [
        "Match the extension to the **middle and ends** of your hair, not the roots: that's where the two meet. Look in daylight, by a window, rather than under indoor lights.",
        {
          list: [
            "**Natural black and off-black** suit most Indian hair. If your hair has warm brown tones in sunlight, a dark brown may blend better.",
            "**Highlights or balayage?** Choose the shade that matches most of your lengths; a stylist can tone the rest.",
            "**Between two shades?** Pick the darker one. A slightly darker extension under your own hair looks more natural than a lighter one on top.",
          ],
        },
        "Not sure? [Send us a photo](" +
          l.contact +
          ") of your hair in daylight and we'll suggest a shade before you order.",
      ],
    },
    {
      id: "texture",
      heading: "4. Match the texture",
      blocks: [
        "Texture matters as much as shade. Straight extensions on wavy hair (or the other way round) are the most common giveaway.",
        {
          list: [
            "**Straight** suits naturally straight hair, or hair you usually straighten.",
            "**Body wave** suits loose, natural waves and hair you blow-dry with volume.",
            "**Deep wave and curly** suit defined waves and curls.",
          ],
        },
        "Because it's 100% human hair, you can straighten or curl extensions to match your style on the day. Use a heat protectant, as you would on your own hair.",
      ],
    },
    {
      id: "amount",
      heading: "5. How much hair you need",
      blocks: [
        "Fine or thin hair needs less extra hair to look full, but light, flat wefts so nothing shows. Thick hair needs more hair to blend, especially at longer lengths.",
        {
          list: [
            "**A little volume:** a small clip-in set or a few wefts.",
            "**Full length and volume:** a complete set (and for thick hair, a heavier one).",
            "**Coverage on top:** a topper sized to the area that's thinning.",
          ],
        },
        "Each product page lists its weights and sizes. If you're unsure, tell us your hair type and the look you want, and we'll help you choose.",
      ],
    },
    {
      id: "before-you-buy",
      heading: "Before you buy",
      blocks: [
        {
          steps: [
            "Decide the look: length, volume, coverage or a fringe.",
            "Measure your hair and choose a length 2–6 inches longer.",
            "Match the shade to your mid-lengths in daylight.",
            "Match your natural texture.",
            "Check our [returns policy](" +
              l.returns +
              "): unused hair in its sealed packaging can be returned, so if you're unsure about the shade, ask us before you open the seal.",
          ],
        },
      ],
    },
  ],
};
