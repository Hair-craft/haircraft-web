import { shopLinks as l } from "../shop-links";
import type { Guide } from "./types";

export const clipInVsTapeInVsTopper: Guide = {
  slug: "clip-in-vs-tape-in-vs-topper",
  title: "Clip-in vs tape-in vs topper: which hair extension is right for you?",
  summary:
    "Clip-ins, tape-ins and toppers all add human hair, but they suit different hair, routines and goals. Here's how they compare, and how to choose.",
  updated: "2026-10-08",
  shop: [
    { label: "Clip-in extensions", href: l.clipIns },
    { label: "Tape-ins", href: l.tapeIns },
    { label: "Hair toppers", href: l.toppers },
  ],
  sections: [
    {
      id: "short-answer",
      heading: "The short answer",
      blocks: [
        {
          list: [
            "**Clip-ins** if you want length or volume for the day, and to take it out at night.",
            "**Tape-ins** if you want length and volume every day, without putting anything in each morning.",
            "**A topper** if your hair is thinning on top or your parting is widening, and you want coverage there.",
          ],
        },
      ],
    },
    {
      id: "clip-ins",
      heading: "Clip-in extensions",
      blocks: [
        "Clip-ins are wefts of hair with small pressure clips. You open the clips, slide them close to the root in sections, and snap them shut. A full set takes about five to ten minutes once you've practised.",
        {
          list: [
            "**Best for:** special occasions, weekends, trying longer hair without commitment.",
            "**Wear time:** a day at a time; take them out before sleeping.",
            "**Upkeep:** wash them every 15–20 wears, or when they need it.",
            "**Good to know:** [seamless clip-ins](" +
              l.seamlessClipIns +
              ") use thin silicone wefts that lie flatter, which helps on fine hair.",
          ],
        },
      ],
    },
    {
      id: "tape-ins",
      heading: "Tape-in extensions",
      blocks: [
        "Tape-ins are thin wefts with a thin adhesive strip. A stylist sandwiches a small section of your hair between two wefts, close to the root. They lie flat and move with your hair.",
        {
          list: [
            "**Best for:** everyday length and volume with nothing to put in each morning.",
            "**Wear time:** usually 6–8 weeks, then a stylist moves them up as your hair grows.",
            "**Upkeep:** sulphate-free shampoo, no oils near the tapes, and gentle brushing from the ends upwards.",
            "**Good to know:** fitting and re-fitting is done by a stylist, so include that in your budget.",
          ],
        },
      ],
    },
    {
      id: "toppers",
      heading: "Hair toppers",
      blocks: [
        "A [topper](" +
          l.toppers +
          ") is a base (often silk or lace) with hair attached, clipped onto the top of your head. It covers the crown and parting, where most thinning shows, and blends with your own hair around it.",
        {
          list: [
            "**Best for:** thinning on top, a widening parting, or hair that's lost volume at the crown.",
            "**Wear time:** daily, taken off at night.",
            "**Upkeep:** wash every 10–15 wears, and store it on a stand or in its box so the base keeps its shape.",
            "**Good to know:** a silk base looks like scalp at the parting, so you can part it naturally.",
          ],
        },
        "Read more in our [guide to hair toppers for thinning hair](" +
          l.guide("hair-toppers-for-thinning-hair") +
          ").",
      ],
    },
    {
      id: "compare",
      heading: "Side by side",
      blocks: [
        {
          list: [
            "**Adds:** clip-ins add length and volume · tape-ins add length and volume · toppers add coverage and volume on top.",
            "**Fitting:** clip-ins and toppers you do yourself · tape-ins by a stylist.",
            "**Daily effort:** clip-ins and toppers go on each morning · tape-ins stay in.",
            "**Wear at night:** take clip-ins and toppers off · tape-ins stay in.",
            "**Commitment:** low for clip-ins and toppers · medium for tape-ins (re-fits every 6–8 weeks).",
          ],
        },
      ],
    },
    {
      id: "still-unsure",
      heading: "Still not sure?",
      blocks: [
        "Many people own more than one: tape-ins for every day and a clip-in piece for extra volume at an event, or a topper for daily coverage and a ponytail for the gym.",
        "If you can, [send us a photo](" +
          l.contact +
          ") of your hair and tell us what you'd like to change. We'll suggest what would suit you, and how to [choose the length and shade](" +
          l.guide("how-to-choose-hair-extensions") +
          ").",
      ],
    },
  ],
};
