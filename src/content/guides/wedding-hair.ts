import { shopLinks as l } from "../shop-links";
import type { Guide } from "./types";

export const weddingHair: Guide = {
  slug: "wedding-hair-length-and-volume",
  title: "Wedding hair: adding length and volume for your big day",
  summary:
    "Long braids, full buns and soft waves all need more hair than most of us have. Here's how brides and guests use human hair extensions for wedding hairstyles, and how to plan ahead.",
  updated: "2026-10-08",
  shop: [
    { label: "Clip-in extensions", href: l.clipIns },
    { label: "Ponytails", href: l.ponytails },
    { label: "Hair toppers", href: l.toppers },
  ],
  sections: [
    {
      id: "why",
      heading: "Why wedding hair needs extra hair",
      blocks: [
        "Classic bridal styles (a long plait with flowers, a full low bun, a high ponytail or open waves) look best with thick, long hair. Extensions add the length and volume, and because they're human hair, they can be curled, braided and decorated with your own.",
      ],
    },
    {
      id: "styles",
      heading: "Which extensions for which style",
      blocks: [
        {
          list: [
            "**Long braid or choti:** a [clip-in set](" +
              l.clipIns +
              ") 4–6 inches longer than your hair, braided in with your own.",
            "**Full bun or juda:** clip-ins for volume, or a [ponytail extension](" +
              l.ponytails +
              ") wrapped into the bun.",
            "**High ponytail:** a wrap-around or claw-clip ponytail, for instant length and swing.",
            "**Open waves:** a full clip-in set, curled together with your own hair.",
            "**Thinning at the parting:** a [topper](" +
              l.toppers +
              ") under the hairstyle, so the parting looks full in photos.",
          ],
        },
      ],
    },
    {
      id: "timeline",
      heading: "Your timeline",
      blocks: [
        {
          steps: [
            "**Two months before:** decide the style with your stylist, and order your extensions, so there's time to exchange a shade if needed.",
            "**One month before:** do a trial with your stylist, wearing the extensions. Check the shade in daylight and in photos with flash.",
            "**Two weeks before:** have the extensions trimmed or layered to blend, if needed.",
            "**The week of the wedding:** wash and condition the extensions, dry them fully, and store them flat.",
            "**On the day:** your stylist curls and sets the extensions with your own hair.",
          ],
        },
        {
          tip:
            "Order early. Our [returns](" +
            l.returns +
            ") allow unused hair in its sealed packaging to be exchanged, but only if there's time before the day.",
        },
      ],
    },
    {
      id: "photos",
      heading: "Choosing a shade that photographs well",
      blocks: [
        "Wedding photos are taken under bright lights, flash and sunshine, which show differences in shade more than a mirror does.",
        {
          list: [
            "Match the extensions to your hair in daylight, then check them in a photo taken with flash.",
            "If you colour your hair, colour it a week or two before the wedding, then match the extensions to the new shade.",
            "Between two shades, choose the darker one: it disappears under your own hair.",
            "Ask your stylist to curl your hair and the extensions together, so the texture matches as well as the colour.",
          ],
        },
      ],
    },
    {
      id: "functions",
      heading: "For haldi, mehendi and sangeet",
      blocks: [
        "Many brides change hairstyles for each function. Clip-ins and ponytails come out in minutes, so you can go from a braid at the mehendi to open waves at the sangeet with the same set.",
        "For the haldi, tie your own hair up and skip the extensions, or wash them carefully afterwards: turmeric can stain lighter shades.",
      ],
    },
    {
      id: "guests",
      heading: "For guests and family",
      blocks: [
        "You don't need to be the bride to want fuller hair in photos. A ponytail extension or a small clip-in set adds length and volume for an evening, and comes off at night.",
      ],
    },
    {
      id: "after",
      heading: "After the wedding",
      blocks: [
        "Wash out hairspray and styling products gently, condition, and store the extensions dry. Cared for well, they'll be ready for the next celebration. Our [care guide](" +
          l.guide("how-to-care-for-human-hair-extensions") +
          ") has the details, and [how to choose the length and shade](" +
          l.guide("how-to-choose-hair-extensions") +
          ") helps you pick before you order.",
      ],
    },
  ],
};
