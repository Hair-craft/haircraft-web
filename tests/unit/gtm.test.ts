import { describe, expect, it } from "vitest";
import { gtmHeadScript, gtmNoscriptSrc } from "@/lib/analytics/gtm";
import { ConfigError, parseSettings } from "@/lib/env";

describe("Google Tag Manager on every page (owner, 2026-11-27)", () => {
  it("is off unless GTM_ID is set, and takes only a container ID", () => {
    expect(parseSettings({ NODE_ENV: "production" }).gtmId).toBeNull();
    expect(parseSettings({ NODE_ENV: "production", GTM_ID: " GTM-NXQ5KSD2 " }).gtmId).toBe(
      "GTM-NXQ5KSD2",
    );
    expect(() => parseSettings({ NODE_ENV: "production", GTM_ID: "G-12345" })).toThrow(ConfigError);
    expect(() => parseSettings({ NODE_ENV: "production", GTM_ID: "GTM-1');alert(1);//" })).toThrow(
      ConfigError,
    );
  });

  it("uses Google's standard snippet, with no website address in it", () => {
    const script = gtmHeadScript("GTM-NXQ5KSD2");
    expect(script).toContain("'gtm.start'");
    expect(script).toContain("event:'gtm.js'");
    expect(script).toContain("https://www.googletagmanager.com/gtm.js?id=");
    expect(script).toContain("'dataLayer','GTM-NXQ5KSD2'");
    expect(script).not.toContain("haircraft");
    expect(gtmNoscriptSrc("GTM-NXQ5KSD2")).toBe(
      "https://www.googletagmanager.com/ns.html?id=GTM-NXQ5KSD2",
    );
    expect(() => gtmHeadScript("nope")).toThrow();
  });
});
