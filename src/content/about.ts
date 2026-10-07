import type { InfoContent } from "./types";

/**
 * DRAFT — OWNER TO CONFIRM: HairCraft's story. The first two paragraphs also
 * appear in the home page's "Our story". No claims about founders, years in
 * business or manufacturing are made until the owner provides them.
 */
export const story = {
  heading: "Crafted for the way you wear your hair",
  paragraphs: [
    "HairCraft started with a simple idea: hair extensions should feel like your own hair, not a costume. So we choose real human hair, in lengths, shades and textures that suit Indian hair, and finish every piece with care.",
    "Whether you want a little volume for a wedding or a whole new look every day, we're here to help you find it, and to make you feel confident wearing it.",
  ],
};

export const aboutContent: InfoContent = {
  intro: story.paragraphs[0],
  sections: [
    {
      id: "story",
      heading: "Our story",
      blocks: [story.paragraphs[1]],
    },
    {
      id: "promise",
      heading: "What we promise",
      blocks: [
        {
          list: [
            "**Real human hair**, which looks, feels and moves like your own, and can be washed and styled.",
            "**Checked by hand** before every order leaves us.",
            "**Honest help** choosing a length, shade and texture. Ask us before you buy.",
            "**Secure payments and tracked delivery** across India.",
          ],
        },
      ],
    },
    {
      id: "talk",
      heading: "Talk to us",
      blocks: [
        "Not sure what suits you? [Contact us](/contact) with a photo of your hair and we'll suggest a match, or [browse the collection](/shop).",
      ],
    },
  ],
};
