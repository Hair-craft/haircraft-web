import { describe, expect, it } from "vitest";
import { decodeWho, encodeWho, phoneNeeded, phoneStatusOf } from "@/lib/session/cookies";

/** Every account needs a mobile number, verified while SMS codes are on (owner, 2026-11-04). */
describe("the account's phone", () => {
  it("is read from the API's user", () => {
    expect(phoneStatusOf({ phone: null, phoneVerifiedAt: null })).toBe("none");
    expect(phoneStatusOf({ phone: "+919812345678", phoneVerifiedAt: null })).toBe("unverified");
    expect(phoneStatusOf({ phone: "+919812345678", phoneVerifiedAt: "2026-11-05T10:00:00Z" })).toBe(
      "verified",
    );
    // An older API answer without the fields counts as no phone.
    expect(phoneStatusOf({})).toBe("none");
  });

  it("travels in the display cookie; older cookies count as done", () => {
    for (const phone of ["none", "unverified", "verified"] as const)
      expect(decodeWho(encodeWho({ firstName: "Asha", email: null, phone }))?.phone).toBe(phone);
    const older = Buffer.from(JSON.stringify({ f: "Asha", e: null })).toString("base64url");
    expect(decodeWho(older)?.phone).toBe("verified");
  });

  it("is asked for when missing, or unverified while SMS codes are on", () => {
    const who = (phone: "none" | "unverified" | "verified") => ({
      firstName: "Asha",
      email: null,
      phone,
    });
    expect(phoneNeeded(who("none"), false)).toBe(true);
    expect(phoneNeeded(who("none"), true)).toBe(true);
    expect(phoneNeeded(who("unverified"), false)).toBe(false);
    expect(phoneNeeded(who("unverified"), true)).toBe(true);
    expect(phoneNeeded(who("verified"), true)).toBe(false);
    expect(phoneNeeded(null, true)).toBe(false);
  });
});
