import { afterEach, describe, expect, it } from "vitest";
import { categoryNav, routes } from "@/components/layout/nav";
import { apiFetch, apiFetchPage, buildUrl, setFetchForTests } from "@/lib/api/client";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import type { Category } from "@/lib/api/types";
import { ConfigError, parseSettings } from "@/lib/env";
import { formatPrice, formatPriceRange } from "@/lib/format";
import { COMING_SOON_PATH, gateDecision } from "@/lib/gate";
import { sessionCookieOptions } from "@/lib/session/cookies";

describe("settings", () => {
  it("uses safe defaults: closed in production, open in development", () => {
    expect(parseSettings({ NODE_ENV: "production" })).toEqual({
      apiBaseUrl: "http://localhost:3000/api/v1",
      storeOpen: false,
      siteUrl: "https://haircraft.in",
      apiTimeoutMs: 10_000,
      freeShippingThreshold: null,
      productsPerPage: 24,
      razorpayScriptUrl: "https://checkout.razorpay.com/v1/checkout.js",
      reviewsCacheSeconds: 120,
      allowIndexing: false,
      googleSiteVerification: null,
    });
    expect(parseSettings({ NODE_ENV: "development" })).toMatchObject({
      storeOpen: true,
      siteUrl: "http://localhost:3001",
    });
  });

  it("loads Razorpay's own payment script in production, unless a test allows a stand-in", () => {
    const stand = "http://localhost:3100/api/v1/dev/razorpay/checkout.js";
    expect(() => parseSettings({ NODE_ENV: "production", RAZORPAY_SCRIPT_URL: stand })).toThrow(
      "RAZORPAY_SCRIPT_URL must be https://checkout.razorpay.com/v1/checkout.js in production",
    );
    expect(
      parseSettings({
        NODE_ENV: "production",
        RAZORPAY_SCRIPT_URL: stand,
        ALLOW_TEST_PAYMENT_SCRIPT: "true",
      }).razorpayScriptUrl,
    ).toBe(stand);
    expect(
      parseSettings({ NODE_ENV: "development", RAZORPAY_SCRIPT_URL: stand }).razorpayScriptUrl,
    ).toBe(stand);
  });

  it("caches approved reviews for 2 minutes unless told otherwise (0 in tests)", () => {
    expect(
      parseSettings({ NODE_ENV: "production", REVIEWS_CACHE_SECONDS: "0" }).reviewsCacheSeconds,
    ).toBe(0);
    expect(() => parseSettings({ REVIEWS_CACHE_SECONDS: "soon" })).toThrow(/REVIEWS_CACHE_SECONDS/);
    expect(() => parseSettings({ REVIEWS_CACHE_SECONDS: "9999" })).toThrow(/REVIEWS_CACHE_SECONDS/);
  });

  it("reads and normalises the values", () => {
    expect(
      parseSettings({
        NODE_ENV: "production",
        API_BASE_URL: " https://api.haircraft.in/api/v1/ ",
        STORE_OPEN: "TRUE",
        API_TIMEOUT_MS: "5000",
      }),
    ).toMatchObject({
      apiBaseUrl: "https://api.haircraft.in/api/v1",
      storeOpen: true,
      apiTimeoutMs: 5000,
    });
  });

  it("lists every problem at once", () => {
    try {
      parseSettings({
        API_BASE_URL: "ftp://x",
        STORE_OPEN: "yes",
        SITE_URL: "nope",
        API_TIMEOUT_MS: "5",
      });
      throw new Error("expected a ConfigError");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const problems = (error as ConfigError).problems.join("\n");
      expect(problems).toContain("API_BASE_URL must be an http(s) address");
      expect(problems).toContain("SITE_URL must be an http(s) address");
      expect(problems).toContain("STORE_OPEN must be true or false");
      expect(problems).toContain("API_TIMEOUT_MS must be a whole number");
    }
  });
});

describe("coming-soon gate", () => {
  it("shows Coming soon at every URL while the shop is closed", () => {
    for (const path of ["/", "/shop", "/shop/wigs", "/account", "/anything"]) {
      expect(gateDecision(path, false)).toEqual({ action: "rewrite", to: COMING_SOON_PATH });
    }
    expect(gateDecision(COMING_SOON_PATH, false)).toEqual({ action: "next" });
  });

  it("serves the shop when open, and moves old coming-soon links to the home page", () => {
    expect(gateDecision("/shop", true)).toEqual({ action: "next" });
    expect(gateDecision(COMING_SOON_PATH, true)).toEqual({ action: "redirect", to: "/" });
  });

  it("always serves robots, sitemap, icons and the health check", () => {
    for (const path of [
      "/robots.txt",
      "/sitemap.xml",
      "/icon.png",
      "/apple-icon.png",
      "/bff/health",
    ]) {
      expect(gateDecision(path, false)).toEqual({ action: "next" });
    }
  });
});

describe("prices", () => {
  it("formats rupees with Indian grouping, without float maths", () => {
    expect(formatPrice("18397.00")).toBe("₹18,397");
    expect(formatPrice("1839700.00")).toBe("₹18,39,700");
    expect(formatPrice("999")).toBe("₹999");
    expect(formatPrice("5999.5")).toBe("₹5,999.50");
    expect(formatPrice("0.10")).toBe("₹0.10");
    expect(formatPrice("1000.00", { alwaysPaise: true })).toBe("₹1,000.00");
    expect(formatPrice("-99.00")).toBe("−₹99");
    expect(formatPrice("not money")).toBe("not money");
  });

  it("shows a range only when the ends differ", () => {
    expect(formatPriceRange("3999.00", "4999.00")).toBe("₹3,999 – ₹4,999");
    expect(formatPriceRange("5499.00", "5499.00")).toBe("₹5,499");
  });
});

describe("session cookies", () => {
  it("are httpOnly and SameSite=Lax always, Secure in production", () => {
    expect(sessionCookieOptions(900, true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
    expect(sessionCookieOptions(-5.5, false)).toMatchObject({ secure: false, maxAge: 0 });
  });
});

describe("category menu", () => {
  const category = (name: string, productCount: number, children: Category[] = []): Category => ({
    id: name,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    description: null,
    productCount,
    children,
  });

  it("links categories and hides empty branches", () => {
    const nav = categoryNav([
      category("Wigs", 1, [category("Lace Front Wigs", 1), category("Empty Sub", 0)]),
      category("Nothing Yet", 0),
      category("Parent Only Children", 0, [category("Has Stock", 2)]),
    ]);
    expect(nav).toEqual([
      {
        label: "Wigs",
        href: "/shop/wigs",
        children: [{ label: "Lace Front Wigs", href: "/shop/lace-front-wigs", children: [] }],
      },
      {
        label: "Parent Only Children",
        href: "/shop/parent-only-children",
        children: [{ label: "Has Stock", href: "/shop/has-stock", children: [] }],
      },
    ]);
    expect(routes.category("a b")).toBe("/shop/a%20b");
  });
});

describe("API client", () => {
  afterEach(() => setFetchForTests(null));

  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });

  it("builds URLs, leaving out empty filters and joining lists", () => {
    expect(
      buildUrl("http://api.test/api/v1", "/products", {
        length: [18, 20],
        color: [],
        inStock: true,
        search: "",
        page: 2,
        none: undefined,
      }),
    ).toBe("http://api.test/api/v1/products?length=18%2C20&inStock=true&page=2");
  });

  it("returns the unwrapped data and sends the token only when given", async () => {
    let seen: RequestInit | undefined;
    setFetchForTests(async (_url, init) => {
      seen = init;
      return json(200, { success: true, message: "OK", data: [{ id: "1" }], meta: null });
    });
    await expect(apiFetch("/categories", { revalidate: 300 })).resolves.toEqual([{ id: "1" }]);
    expect((seen?.headers as Record<string, string>).Authorization).toBeUndefined();
    expect((seen as { next?: unknown }).next).toEqual({ revalidate: 300, tags: undefined });

    await apiFetch("/profile", { token: "t0k" });
    expect((seen?.headers as Record<string, string>).Authorization).toBe("Bearer t0k");
    // Personal requests are never cached, even if asked.
    expect(seen?.cache).toBe("no-store");
  });

  it("returns items and page info for lists", async () => {
    const meta = {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    setFetchForTests(async () =>
      json(200, { success: true, message: "OK", data: [{ id: "p" }], meta }),
    );
    await expect(apiFetchPage("/products")).resolves.toEqual({ items: [{ id: "p" }], meta });
  });

  it("turns API errors into ApiError with field errors and the request id", async () => {
    setFetchForTests(async () =>
      json(
        400,
        {
          success: false,
          code: "VALIDATION_FAILED",
          message: "Validation failed",
          errors: [{ field: "email", messages: ["email must be a valid email address"] }],
          data: null,
        },
        { "x-request-id": "req-1" },
      ),
    );
    const error = (await apiFetch("/auth/register", { method: "POST", body: {} }).catch(
      (e) => e,
    )) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_FAILED", requestId: "req-1" });
    expect(error.messagesFor("email")).toEqual(["email must be a valid email address"]);
    expect(error.unavailable).toBe(false);
  });

  it("reports an unreachable API, a timeout and an unreadable answer calmly", async () => {
    setFetchForTests(async () => {
      throw new TypeError("fetch failed");
    });
    const down = (await apiFetch("/categories").catch((e) => e)) as ApiError;
    expect(down).toMatchObject({ status: 0, code: "API_UNREACHABLE" });
    expect(down.unavailable).toBe(true);
    expect(friendlyMessage(down)).toBe(
      "We can't reach the shop right now. Please try again in a moment.",
    );

    setFetchForTests(async () => {
      const timeout = new Error("timed out");
      timeout.name = "TimeoutError";
      throw timeout;
    });
    expect(await apiFetch("/categories").catch((e) => e)).toMatchObject({ code: "API_TIMEOUT" });

    setFetchForTests(async () => new Response("<html>gateway</html>", { status: 502 }));
    const garbled = (await apiFetch("/categories").catch((e) => e)) as ApiError;
    expect(garbled.code).toBe("API_BAD_RESPONSE");
    expect(friendlyMessage(garbled)).toContain("can't reach the shop");
  });

  it("keeps customer-facing API messages, hides server errors", () => {
    expect(
      friendlyMessage(
        new ApiError(409, "REVIEW_ALREADY_EXISTS", "You have already reviewed this product."),
      ),
    ).toBe("You have already reviewed this product.");
    expect(friendlyMessage(new ApiError(500, "INTERNAL_ERROR", "stack trace here"))).toBe(
      "Something went wrong on our side. Please try again in a moment.",
    );
    expect(friendlyMessage(new ApiError(429, "TOO_MANY_REQUESTS", "x"))).toContain(
      "Too many attempts",
    );
    expect(friendlyMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
  });
});
