import { describe, expect, it } from "vitest";
import {
  ACCESS_COOKIE,
  clearedSessionCookies,
  decodeWho,
  encodeWho,
  flashCookie,
  REFRESH_COOKIE,
  sessionCookies,
  WHO_COOKIE,
} from "@/lib/session/cookies";
import {
  accessCookieSeconds,
  authErrorMessage,
  indianMobile,
  lockedMinutes,
  passwordChecks,
  passwordProblem,
  refreshCookieSeconds,
  refreshFailure,
  safeNext,
} from "@/lib/session/rules";

describe("where to go after signing in", () => {
  it("allows paths on this site, with their query", () => {
    expect(safeNext("/account")).toBe("/account");
    expect(safeNext("/account/orders?page=2#top")).toBe("/account/orders?page=2#top");
    expect(safeNext("/product/silky-tape-ins?variant=ST-18")).toBe(
      "/product/silky-tape-ins?variant=ST-18",
    );
  });

  it("refuses other sites, odd paths and the sign-in pages", () => {
    for (const bad of [
      "",
      null,
      undefined,
      "account",
      "//evil.com",
      "/\\evil.com",
      "https://evil.com/account",
      "javascript:alert(1)",
      "/\nevil",
      "/sign-in",
      "/register?next=/account",
      `/${"a".repeat(600)}`,
    ])
      expect(safeNext(bad as string | null | undefined)).toBeNull();
  });
});

describe("cookies", () => {
  const now = Date.parse("2026-10-06T10:00:00Z");
  const tokens = {
    accessToken: "access",
    accessTokenExpiresIn: 900,
    refreshToken: "refresh",
    refreshTokenExpiresAt: "2026-10-13T10:00:00Z",
    user: { id: "u1", email: "priya@example.com", firstName: "Priya", lastName: null },
  };

  it("keeps the access cookie a little shorter than the token, the others as long as the refresh token", () => {
    expect(accessCookieSeconds(900)).toBe(870);
    expect(accessCookieSeconds(10)).toBe(1);
    expect(refreshCookieSeconds(tokens.refreshTokenExpiresAt, now)).toBe(7 * 24 * 3600);
    expect(refreshCookieSeconds("not a date", now)).toBe(0);
  });

  it("sets three httpOnly, SameSite=Lax cookies, Secure in production", () => {
    const cookies = sessionCookies(tokens, true, now);
    expect(cookies.map((c) => c.name)).toEqual([ACCESS_COOKIE, REFRESH_COOKIE, WHO_COOKIE]);
    for (const cookie of cookies)
      expect(cookie.options).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    expect(cookies[0].options.maxAge).toBe(870);
    expect(sessionCookies(tokens, false, now)[0].options.secure).toBe(false);
    expect(decodeWho(cookies[2].value)).toEqual({ firstName: "Priya", email: "priya@example.com" });
  });

  it("clears them all; the flash note is readable by the page", () => {
    expect(clearedSessionCookies(true).every((c) => c.value === "" && c.options.maxAge === 0)).toBe(
      true,
    );
    expect(flashCookie("signed-out", true).options.httpOnly).toBe(false);
  });

  it("reads the display cookie safely, whatever it contains", () => {
    expect(decodeWho(encodeWho({ firstName: "Ā<b>", email: "a@b.in" }))).toEqual({
      firstName: "Ā<b>",
      email: "a@b.in",
    });
    expect(decodeWho(undefined)).toBeNull();
    expect(decodeWho("not-base64-json")).toBeNull();
    expect(decodeWho(Buffer.from('{"f":1}').toString("base64url"))).toBeNull();
  });
});

describe("a failed refresh", () => {
  it("ends the session only when it certainly ended", () => {
    expect(refreshFailure(401, "REFRESH_TOKEN_REUSED")).toBe("ended");
    expect(refreshFailure(403, "ACCOUNT_SUSPENDED")).toBe("ended");
  });

  it("keeps the cookies when the token may just have lost a race", () => {
    expect(refreshFailure(401, "INVALID_REFRESH_TOKEN")).toBe("keep");
  });

  it("waits when the API can't answer", () => {
    expect(refreshFailure(0, "UNREACHABLE")).toBe("unavailable");
    expect(refreshFailure(503, "SERVICE_UNAVAILABLE")).toBe("unavailable");
    expect(refreshFailure(429, "TOO_MANY_REQUESTS")).toBe("unavailable");
  });
});

describe("messages", () => {
  it("puts the API's sign-in errors in the shop's words", () => {
    expect(authErrorMessage(401, "INVALID_CREDENTIALS", "")).toBe("Incorrect email or password.");
    expect(
      authErrorMessage(
        423,
        "ACCOUNT_LOCKED",
        "Too many incorrect passwords. This account is locked for 14 more minutes.",
      ),
    ).toBe("Too many attempts. Please try again in 14 minutes.");
    expect(authErrorMessage(423, "ACCOUNT_LOCKED", "… locked for 1 more minute.")).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
    expect(authErrorMessage(403, "ACCOUNT_SUSPENDED", "")).toMatch(/suspended/);
    expect(authErrorMessage(429, "TOO_MANY_REQUESTS", "")).toMatch(/wait a minute/);
    expect(authErrorMessage(0, "UNREACHABLE", "")).toMatch(/can't reach the shop/);
    expect(lockedMinutes("no number here")).toBeNull();
  });
});

describe("password rules (the same as the API's)", () => {
  it("needs 8 characters, a letter and a number, within 72 bytes", () => {
    expect(passwordProblem("short1")).toMatch(/8 characters/);
    expect(passwordProblem("onlyletters")).toMatch(/letter and one number/);
    expect(passwordProblem("12345678")).toMatch(/letter and one number/);
    expect(passwordProblem("Silky2026")).toBeNull();
    expect(passwordProblem("पासवर्ड१२३४५")).toBeNull();
    expect(passwordProblem(`a1${"€".repeat(30)}`)).toMatch(/too long/);
  });

  it("ticks off each rule while typing", () => {
    expect(passwordChecks("abc").map((c) => c.met)).toEqual([false, true, false]);
    expect(passwordChecks("Silky2026").every((c) => c.met)).toBe(true);
  });
});

describe("Indian mobile numbers", () => {
  it("accepts the usual ways of writing one, stored as +91 and 10 digits", () => {
    for (const typed of [
      "9876543210",
      "98765 43210",
      "+91 98765-43210",
      "098765 43210",
      "91 9876543210",
    ])
      expect(indianMobile(typed)).toBe("+919876543210");
    expect(indianMobile("  ")).toBeNull();
  });

  it("refuses numbers that aren't Indian mobiles", () => {
    for (const typed of ["12345", "5876543210", "+44 7700 900123", "98765432101"])
      expect(indianMobile(typed)).toBeUndefined();
  });
});
