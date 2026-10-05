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
}

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
    problems.push(`${name} must be an http(s) address, e.g. http://localhost:3000/api/v1 (got "${value}")`);
    return value;
  }
}

function parseBoolean(name: string, value: string | undefined, fallback: boolean, problems: string[]): boolean {
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
  const apiBaseUrl = parseUrl("API_BASE_URL", env.API_BASE_URL?.trim() || "http://localhost:3000/api/v1", problems);
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
      problems.push(`API_TIMEOUT_MS must be a whole number of milliseconds from 1000 to 60000 (got "${timeoutRaw}")`);
    }
  }
  if (problems.length > 0) throw new ConfigError(problems);
  return { apiBaseUrl, storeOpen, siteUrl, apiTimeoutMs };
}

let cached: StoreSettings | undefined;

/** The current settings (validated once per process). */
export function settings(): StoreSettings {
  cached ??= parseSettings(process.env);
  return cached;
}
