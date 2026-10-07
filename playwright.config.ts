import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against the real NestJS API, in its own copy:
 *
 * - :3100 the API, compiled from `../nestjs-haircraft` into `dist-e2e`
 *   (so it never clashes with a running `nest start --watch`), using the
 *   test database `hc_e2e` (prepared once with `scripts/setup-e2e-db.ps1`)
 *   and relaxed rate limits, so test runs never trip them and test accounts
 *   never touch the development database
 *
 * `npm run test:e2e` builds the storefront once and starts it three times:
 *
 * - :3101 shop open (STORE_OPEN=true), indexable like the live site (ALLOW_INDEXING=true)
 * - :3102 shop closed (STORE_OPEN=false): the coming-soon gate
 * - :3103 shop open, API unreachable: the friendly "can't reach the shop" states
 */
export const OPEN = "http://localhost:3101";
export const CLOSED = "http://localhost:3102";
export const API_DOWN = "http://localhost:3103";
/** The test API (tests compare pages against it). */
export const API = "http://localhost:3100/api/v1";
/** Failed sign-ins before an account is locked, on the test API (kept low so the test is short). */
export const TEST_MAX_FAILED_LOGINS = 3;

const server = (port: number, env: Record<string, string>) => ({
  command: `npx next start -p ${port}`,
  // robots.txt answers 200 whatever the settings (health answers 503 when the API is down).
  url: `http://localhost:${port}/robots.txt`,
  reuseExistingServer: false,
  timeout: 60_000,
  env: {
    NODE_ENV: "production",
    SITE_URL: `http://localhost:${port}`,
    // The photos come from the local API; Next reads this when the server starts, not only at build.
    ALLOW_LOCAL_IMAGES: "true",
    FREE_SHIPPING_THRESHOLD: "1999",
    // Small pages, so pagination is tested on the sample catalogue (6 products).
    PRODUCTS_PER_PAGE: "2",
    // Online payment against the test API's stand-in Razorpay (B13), never the real one.
    RAZORPAY_SCRIPT_URL: `${API}/dev/razorpay/checkout.js`,
    ALLOW_TEST_PAYMENT_SCRIPT: "true",
    // Reviews always fresh, so one approved during a test shows at once.
    REVIEWS_CACHE_SECONDS: "0",
    ...env,
  },
});

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: OPEN, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec/ },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile\.spec/,
      testIgnore: /vitals\.mobile\.spec/,
    },
    // Speed is measured last, alone, so other tests don't share the computer with it.
    {
      name: "vitals",
      use: { ...devices["Pixel 7"] },
      testMatch: /vitals\.mobile\.spec/,
      dependencies: ["desktop", "mobile"],
    },
  ],
  webServer: [
    {
      // A fresh compile each run (the old output would otherwise be read back in as input).
      command:
        "node -e \"require('fs').rmSync('dist-e2e',{recursive:true,force:true})\" && " +
        "npx tsc -p tsconfig.build.json --outDir dist-e2e --incremental false && node dist-e2e/main.js",
      cwd: "../nestjs-haircraft",
      url: `${API}/health/live`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        APP_PORT: "3100",
        DATABASE_NAME: "hc_e2e",
        STORAGE_DRIVER: "local",
        PUBLIC_BASE_URL: "http://localhost:3100",
        THROTTLE_LIMIT: "100000",
        AUTH_THROTTLE_LIMIT: "10000",
        AUTH_MAX_FAILED_LOGINS: String(TEST_MAX_FAILED_LOGINS),
        AUTH_LOCKOUT_MINUTES: "1",
        ORDER_JOBS_ENABLED: "false",
        // Cash on delivery on, so both kinds of order are tested (up to ₹10,000).
        COD_ENABLED: "true",
        COD_MAX_ORDER_AMOUNT: "10000",
        // Online payment through the stand-in Razorpay (no internet, no keys).
        ONLINE_PAYMENTS_ENABLED: "true",
        RAZORPAY_FAKE: "true",
        LOG_LEVEL: "warn",
      },
    },
    // The open shop behaves like the live site, which search engines may index.
    server(3101, { STORE_OPEN: "true", API_BASE_URL: API, ALLOW_INDEXING: "true" }),
    server(3102, { STORE_OPEN: "false", API_BASE_URL: API }),
    server(3103, { STORE_OPEN: "true", API_BASE_URL: "http://localhost:3999/api/v1" }),
  ],
});
