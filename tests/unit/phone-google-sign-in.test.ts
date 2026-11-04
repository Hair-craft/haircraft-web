import { describe, expect, it } from "vitest";
import { clientFrom } from "@/lib/session/api";
import { decodeWho, encodeWho } from "@/lib/session/cookies";
import { phoneAuthMessage, smsCode } from "@/lib/session/rules";

describe("phone and Google sign-in (owner, 2026-11-04)", () => {
  it("reads a 6-digit code from what was typed or pasted", () => {
    expect(smsCode("123456")).toBe("123456");
    expect(smsCode(" 123 456 ")).toBe("123456");
    expect(smsCode("Your HairCraft code: 123-456")).toBe("123456");
    expect(smsCode("12345")).toBeNull();
    expect(smsCode("1234567")).toBeNull();
    expect(smsCode("")).toBeNull();
  });

  it("puts the API's errors in the shop's words", () => {
    expect(phoneAuthMessage(400, "OTP_INVALID", "x", { attemptsLeft: 3 })).toBe(
      "That code isn't right. 3 tries left.",
    );
    expect(phoneAuthMessage(400, "OTP_INVALID", "x", { attemptsLeft: 1 })).toBe(
      "That code isn't right. 1 try left.",
    );
    expect(phoneAuthMessage(400, "OTP_INVALID", "x")).toMatch(/isn't right/);
    expect(phoneAuthMessage(400, "OTP_EXPIRED", "x")).toMatch(/expired/);
    expect(phoneAuthMessage(400, "OTP_TOO_MANY_ATTEMPTS", "x")).toMatch(/Too many wrong codes/);
    // The API's own sentence says how long to wait.
    expect(
      phoneAuthMessage(
        429,
        "OTP_RATE_LIMITED",
        "Too many codes requested. Please try again in 25 seconds.",
      ),
    ).toBe("Too many codes requested. Please try again in 25 seconds.");
    expect(phoneAuthMessage(503, "SMS_UNAVAILABLE", "x")).toMatch(/couldn't send the code/);
    expect(phoneAuthMessage(409, "PHONE_IN_USE", "x")).toMatch(/another account/);
    expect(phoneAuthMessage(403, "GOOGLE_STAFF_ACCOUNT", "x")).toMatch(/staff member/);
    expect(phoneAuthMessage(0, "API_UNREACHABLE", "x")).toMatch(/can't reach the shop/);
    expect(phoneAuthMessage(400, "SOMETHING_NEW", "x")).toBe(
      "Please check the details and try again.",
    );
  });

  it("keeps the header's name for customers without an email", () => {
    expect(decodeWho(encodeWho({ firstName: "Asha", email: null }))).toEqual({
      firstName: "Asha",
      email: null,
    });
    expect(decodeWho(encodeWho({ firstName: "Meera", email: "meera@example.com" }))).toEqual({
      firstName: "Meera",
      email: "meera@example.com",
    });
    // Cookies written before this change (email always set) still read.
    const old = Buffer.from(JSON.stringify({ f: "Ravi", e: "ravi@example.com" })).toString(
      "base64url",
    );
    expect(decodeWho(old)).toEqual({ firstName: "Ravi", email: "ravi@example.com" });
    const bad = Buffer.from(JSON.stringify({ f: "X", e: 5 })).toString("base64url");
    expect(decodeWho(bad)).toBeNull();
  });

  it("forwards the address our proxy saw, not one the visitor made up", () => {
    // nginx appends the real address ($proxy_add_x_forwarded_for).
    expect(clientFrom(new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" })).ip).toBe(
      "203.0.113.9",
    );
    expect(clientFrom(new Headers({ "x-forwarded-for": "203.0.113.9" })).ip).toBe("203.0.113.9");
    expect(clientFrom(new Headers({ "x-real-ip": "198.51.100.7" })).ip).toBe("198.51.100.7");
    expect(clientFrom(new Headers()).ip).toBeNull();
  });
});
