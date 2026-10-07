import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** One finding, short enough to read in a test failure. */
interface Finding {
  rule: string;
  impact: string | null | undefined;
  help: string;
  /** Where (CSS selector), and for contrast the colours and ratio found. */
  nodes: string[];
}

/** A11Y_REPORT=1 lists every finding instead of failing (to survey the whole site at once). */
const REPORT_ONLY = process.env.A11Y_REPORT === "1";

/**
 * Runs axe-core (WCAG 2.2 A and AA, plus best practices) on the page as it is
 * now and fails on any serious or critical finding. Moderate and minor ones
 * are printed, to be fixed where sensible.
 */
export async function expectAccessible(page: Page, where: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    // Next.js's dev-only overlay is not part of the shop.
    .exclude("nextjs-portal")
    .analyze();
  const findings: Finding[] = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 8).map((n) => {
      const data = n.any[0]?.data as
        | {
            fgColor?: string;
            bgColor?: string;
            contrastRatio?: number;
            expectedContrastRatio?: string;
          }
        | undefined;
      const colours = data?.fgColor
        ? ` [${data.fgColor} on ${data.bgColor}: ${data.contrastRatio} < ${data.expectedContrastRatio}]`
        : "";
      return `${n.target.join(" ")}${colours} ${n.html.slice(0, 120)}`;
    }),
  }));
  const blocking = findings.filter((f) => f.impact === "serious" || f.impact === "critical");
  const other = findings.filter((f) => !blocking.includes(f));
  if (REPORT_ONLY) {
    if (findings.length > 0)
      console.log(`[a11y-report] ${where}\n${JSON.stringify(findings, null, 1)}`);
    return;
  }
  if (other.length > 0) console.log(`[a11y] ${where} (moderate/minor):`, JSON.stringify(other));
  expect(blocking, `${where}: serious or critical accessibility problems`).toEqual([]);
}
