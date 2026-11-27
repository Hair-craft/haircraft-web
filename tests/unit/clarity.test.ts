import { describe, expect, it } from "vitest";
import { clarityScript } from "@/lib/analytics/clarity";
import { ConfigError, parseSettings } from "@/lib/env";

describe("Microsoft Clarity (owner, 2026-11-27)", () => {
  it("is off unless CLARITY_ID is set, and takes only a project ID", () => {
    expect(parseSettings({ NODE_ENV: "production" }).clarityId).toBeNull();
    expect(parseSettings({ NODE_ENV: "production", CLARITY_ID: " zk56h1pkqo " }).clarityId).toBe(
      "zk56h1pkqo",
    );
    expect(() =>
      parseSettings({ NODE_ENV: "production", CLARITY_ID: 'zk5");alert(1);//' }),
    ).toThrow(ConfigError);
  });

  it("uses Microsoft's snippet, started after the page has loaded", () => {
    const script = clarityScript("zk56h1pkqo");
    expect(script).toContain('"https://www.clarity.ms/tag/"+i');
    expect(script).toContain('"clarity","script","zk56h1pkqo"');
    expect(script).toContain('addEventListener("load"');
    expect(script).not.toContain("haircraft");
    expect(() => clarityScript("BAD ID")).toThrow();
  });
});
