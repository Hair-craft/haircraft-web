/**
 * Storefront settings, read from environment variables and validated.
 * Pure (no `server-only`), so `proxy.ts`, the server and unit tests can all
 * use it. Nothing here is a secret, but none of it is sent to the browser
 * either (no NEXT_PUBLIC_ prefix).
 */

export interface StoreSettings {
  /** The NestJS API, e.g. `http://localhost:3000/api/v1` (no trailing slash). */
  apiBaseUrl: string;
  /** The shop is open; when false every page shows Coming soon. */
  storeOpen: boolean;
  /** Public address of the storefront, for links and metadata. */
  siteUrl: string;
  /** How long one API call may take before it is given up. */
  apiTimeoutMs: number;
  /**
   * Free shipping from this order total, in rupees ("1999"), for marketing
   * copy only: it must match the backend's FREE_SHIPPING_THRESHOLD, and
   * checkout always shows the real shipping from the API. null = don't
   * mention an amount.
   */
  freeShippingThreshold: string | null;
  /** Products per page on the shop's listing pages (1–100, default 24). */
  productsPerPage: number;
  /**
   * Razorpay's payment script. Always Razorpay's own in production; tests
   * point it at the API's stand-in (with ALLOW_TEST_PAYMENT_SCRIPT=true).
   */
  razorpayScriptUrl: string;
  /**
   * How long approved reviews may be cached (seconds, default 120): a newly
   * approved review appears within this time. 0 = always fresh (tests).
   */
  reviewsCacheSeconds: number;
  /**
   * Search engines may index the site (default false). Set true on the live
   * site only, so test and preview copies never appear in search results.
   */
  allowIndexing: boolean;
  /** Google Search Console's HTML-tag verification code, or null. */
  googleSiteVerification: string | null;
  /** Bing Webmaster Tools' HTML-tag verification code (msvalidate.01), or null. */
  bingSiteVerification: string | null;
}

/** Razorpay Checkout's script, as Razorpay publishes it. */
export const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

type Env = Record<string, string | undefined>;

export class ConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid storefront settings:\n- ${problems.join("\n- ")}`);
    this.name = "ConfigError";
  }
}

function parseUrl(name: string, value: string, problems: string[]): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return value.replace(/\/+$/, "");
  } catch {
    problems.push(
      `${name} must be an http(s) address, e.g. http://localhost:3000/api/v1 (got "${value}")`,
    );
    return value;
  }
}

function parseBoolean(
  name: string,
  value: string | undefined,
  fallback: boolean,
  problems: string[],
): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  const normalised = value.trim().toLowerCase();
  if (normalised === "true") return true;
  if (normalised === "false") return false;
  problems.push(`${name} must be true or false (got "${value}")`);
  return fallback;
}

/**
 * Validates the settings. Defaults: the shop is closed (Coming soon) in
 * production unless STORE_OPEN=true, and open everywhere else.
 */
export function parseSettings(env: Env): StoreSettings {
  const problems: string[] = [];
  const production = env.NODE_ENV === "production";
  const apiBaseUrl = parseUrl(
    "API_BASE_URL",
    env.API_BASE_URL?.trim() || "http://localhost:3000/api/v1",
    problems,
  );
  const siteUrl = parseUrl(
    "SITE_URL",
    env.SITE_URL?.trim() || (production ? "https://haircraft.in" : "http://localhost:3001"),
    problems,
  );
  const storeOpen = parseBoolean("STORE_OPEN", env.STORE_OPEN, !production, problems);
  const timeoutRaw = env.API_TIMEOUT_MS?.trim();
  let apiTimeoutMs = 10_000;
  if (timeoutRaw) {
    apiTimeoutMs = Number(timeoutRaw);
    if (!Number.isInteger(apiTimeoutMs) || apiTimeoutMs < 1000 || apiTimeoutMs > 60_000) {
      problems.push(
        `API_TIMEOUT_MS must be a whole number of milliseconds from 1000 to 60000 (got "${timeoutRaw}")`,
      );
    }
  }
  const shippingRaw = env.FREE_SHIPPING_THRESHOLD?.trim();
  let freeShippingThreshold: string | null = null;
  if (shippingRaw) {
    if (/^\d{1,7}(\.\d{1,2})?$/.test(shippingRaw)) freeShippingThreshold = shippingRaw;
    else
      problems.push(
        `FREE_SHIPPING_THRESHOLD must be an amount in rupees such as 1999 (got "${shippingRaw}")`,
      );
  }
  const perPageRaw = env.PRODUCTS_PER_PAGE?.trim();
  let productsPerPage = 24;
  if (perPageRaw) {
    productsPerPage = Number(perPageRaw);
    if (!/^\d+$/.test(perPageRaw) || productsPerPage < 1 || productsPerPage > 100) {
      problems.push(`PRODUCTS_PER_PAGE must be a whole number from 1 to 100 (got "${perPageRaw}")`);
    }
  }
  const razorpayScriptUrl = parseUrl(
    "RAZORPAY_SCRIPT_URL",
    env.RAZORPAY_SCRIPT_URL?.trim() || RAZORPAY_SCRIPT_URL,
    problems,
  );
  if (
    production &&
    razorpayScriptUrl !== RAZORPAY_SCRIPT_URL &&
    !parseBoolean("ALLOW_TEST_PAYMENT_SCRIPT", env.ALLOW_TEST_PAYMENT_SCRIPT, false, problems)
  ) {
    problems.push(
      `RAZORPAY_SCRIPT_URL must be ${RAZORPAY_SCRIPT_URL} in production (a stand-in needs ALLOW_TEST_PAYMENT_SCRIPT=true, for tests only)`,
    );
  }
  const reviewsCacheRaw = env.REVIEWS_CACHE_SECONDS?.trim();
  let reviewsCacheSeconds = 120;
  if (reviewsCacheRaw) {
    reviewsCacheSeconds = Number(reviewsCacheRaw);
    if (!/^\d+$/.test(reviewsCacheRaw) || reviewsCacheSeconds > 3600)
      problems.push(
        `REVIEWS_CACHE_SECONDS must be a whole number of seconds from 0 to 3600 (got "${reviewsCacheRaw}")`,
      );
  }
  const allowIndexing = parseBoolean("ALLOW_INDEXING", env.ALLOW_INDEXING, false, problems);
  const verificationCode = (name: string, where: string): string | null => {
    const raw = env[name]?.trim();
    if (!raw) return null;
    if (/^[\w-]{10,100}$/.test(raw)) return raw;
    problems.push(
      `${name} must be the code from ${where}'s HTML tag: letters, digits, - and _ only (got "${raw}")`,
    );
    return null;
  };
  const googleSiteVerification = verificationCode("GOOGLE_SITE_VERIFICATION", "Search Console");
  const bingSiteVerification = verificationCode("BING_SITE_VERIFICATION", "Bing Webmaster Tools");
  if (problems.length > 0) throw new ConfigError(problems);
  return {
    apiBaseUrl,
    storeOpen,
    siteUrl,
    apiTimeoutMs,
    freeShippingThreshold,
    productsPerPage,
    razorpayScriptUrl,
    reviewsCacheSeconds,
    allowIndexing,
    googleSiteVerification,
    bingSiteVerification,
  };
}

let cached: StoreSettings | undefined;

/** The current settings (validated once per process). */
export function settings(): StoreSettings {
  cached ??= parseSettings(process.env);
  return cached;
}
