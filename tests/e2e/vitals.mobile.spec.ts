import { expect, test, type Page } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";

/**
 * Core Web Vitals in the lab: each main page loaded as a mid-range phone on a
 * slow 4G connection (Lighthouse's mobile settings: 150 ms latency, 1.6 Mbit/s
 * down, 750 kbit/s up, CPU 4× slower), against the production build. Runs
 * alone, after every other test (the "vitals" project), one page at a time;
 * each page is loaded three times and the middle result counts.
 *
 * Budgets:
 * - LCP and CLS: Google's "good" thresholds (2.5 s, 0.1).
 * - JavaScript downloaded: just above today's size, so new weight is noticed.
 * - TBT (busy time, the lab's stand-in for INP): a guard against large
 *   slowdowns, not Google's 200 ms. On this computer React's start-up and the
 *   browser's first layout alone take two ~250 ms tasks at 4× slowdown on every
 *   page (S15 status), and runs vary by ±100 ms. Real phones' INP is measured
 *   after launch (S16).
 */
/** How much slower than this computer the test phone is (Lighthouse uses 4). */
const CPU_SLOWDOWN = Number(process.env.VITALS_CPU_SLOWDOWN ?? 4);
const BUDGET = { lcpMs: 2500, cls: 0.1 };
const TBT_GUARD_MS: Record<string, number> = { home: 900, default: 650 };
/** JavaScript downloaded (compressed, kB) per page. */
const JS_BUDGET_KB: Record<string, number> = { home: 240, default: 185 };

interface Vitals {
  lcpMs: number;
  cls: number;
  tbtMs: number;
  jsKb: number;
}

async function measure(page: Page, url: string): Promise<Vitals & { tasks: number[] }> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });
  await page.addInitScript(() => {
    const w = window as unknown as {
      __vitals: { lcp: number; cls: number; tbt: number; tasks: number[] };
    };
    w.__vitals = { lcp: 0, cls: 0, tbt: 0, tasks: [] };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.__vitals.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[])
        if (!entry.hadRecentInput) w.__vitals.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        w.__vitals.tbt += Math.max(0, entry.duration - 50);
        w.__vitals.tasks.push(Math.round(entry.duration));
      }
    }).observe({ type: "longtask", buffered: true });
  });
  await page.goto(url, { waitUntil: "load" });
  // Let late work (hydration, lazy chunks) finish, as a visitor would wait.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const result = await page.evaluate(() => {
    const w = window as unknown as {
      __vitals: { lcp: number; cls: number; tbt: number; tasks: number[] };
    };
    const js = performance
      .getEntriesByType("resource")
      .filter(
        (r) =>
          (r as PerformanceResourceTiming).initiatorType === "script" || r.name.endsWith(".js"),
      )
      .reduce((sum, r) => sum + (r as PerformanceResourceTiming).transferSize, 0);
    return { ...w.__vitals, js };
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  return {
    lcpMs: Math.round(result.lcp),
    cls: Math.round(result.cls * 1000) / 1000,
    tbtMs: Math.round(result.tbt),
    jsKb: Math.round(result.js / 1024),
    tasks: result.tasks,
  };
}

/** The middle of three runs, so one slow moment on the computer doesn't decide. */
async function typical(page: Page, url: string): Promise<Vitals & { tasks: number[] }> {
  const runs: (Vitals & { tasks: number[] })[] = [];
  for (let i = 0; i < 3; i++) {
    const fresh = i === 0 ? page : await page.context().newPage();
    runs.push(await measure(fresh, url));
    if (fresh !== page) await fresh.close();
  }
  const middle = (pick: (v: Vitals) => number) => runs.map(pick).sort((a, b) => a - b)[1];
  return {
    lcpMs: middle((v) => v.lcpMs),
    cls: middle((v) => v.cls),
    tbtMs: middle((v) => v.tbtMs),
    jsKb: middle((v) => v.jsKb),
    tasks: runs.find((r) => r.tbtMs === middle((v) => v.tbtMs))?.tasks ?? [],
  };
}

test.describe("Core Web Vitals on a slow phone", () => {
  const pages: { name: string; path: (api: typeof API) => Promise<string> }[] = [
    { name: "home", path: async () => "/" },
    { name: "shop", path: async () => "/shop" },
    {
      name: "category",
      path: async () => {
        const res = await fetch(`${API}/categories`);
        return `/shop/${(await res.json()).data[0].slug}`;
      },
    },
    {
      name: "product",
      path: async () => {
        const res = await fetch(`${API}/products?limit=1`);
        return `/product/${(await res.json()).data[0].slug}`;
      },
    },
    { name: "search", path: async () => "/search?q=wig" },
    { name: "faq", path: async () => "/faq" },
  ];

  test("every main page is within budget", async ({ page }) => {
    test.setTimeout(600_000);
    for (const { name, path } of pages) {
      const url = OPEN + (await path(API));
      const vitals = await typical(page, url);
      const line = `${name} ${JSON.stringify(vitals)}`;
      test.info().annotations.push({ type: "vitals", description: line });
      console.log(`[vitals] ${line}`);
      expect.soft(vitals.lcpMs, `${name}: LCP (ms)`).toBeLessThanOrEqual(BUDGET.lcpMs);
      expect.soft(vitals.cls, `${name}: CLS`).toBeLessThanOrEqual(BUDGET.cls);
      expect
        .soft(vitals.tbtMs, `${name}: TBT (ms)`)
        .toBeLessThanOrEqual(TBT_GUARD_MS[name] ?? TBT_GUARD_MS.default);
      expect
        .soft(vitals.jsKb, `${name}: JavaScript (kB)`)
        .toBeLessThanOrEqual(JS_BUDGET_KB[name] ?? JS_BUDGET_KB.default);
    }
  });
});
