/** Swatch colours for common shade words; anything else gets a neutral dot. */
const SWATCHES: [RegExp, string][] = [
  [/highlight|balayage|ombre|ombré|streak|mix/i, "linear-gradient(45deg,#3b2317,#a3683b,#c99a5b)"],
  [/jet|off.?black|natural black|black/i, "#151312"],
  [/dark brown|espresso|chocolate/i, "#2c1f1d"],
  [/chestnut|auburn|copper/i, "#6b3a22"],
  [/burgundy|wine|red/i, "#5b1a24"],
  [/caramel|honey/i, "#a3683b"],
  [/blonde|golden|gold/i, "#c99a5b"],
  [/grey|gray|silver/i, "#9a9a9a"],
  [/white|platinum/i, "#ece7df"],
  [/brown/i, "#4e2b1e"],
];

/** The swatch for a colour name (product page colour choices). */
export function swatchFor(color: string): string {
  return SWATCHES.find(([pattern]) => pattern.test(color))?.[1] ?? "#d9cfc0";
}
