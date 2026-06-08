import { describe, expect, it } from "vitest";
import { parseUserAgent } from "@/lib/user-agent";

describe("parseUserAgent", () => {
  it("returns a shape with browser, os, and isMobile", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    );
    expect(result).toHaveProperty("browser");
    expect(result).toHaveProperty("os");
    expect(typeof result.isMobile).toBe("boolean");
  });

  it("flags a mobile user agent", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    );
    expect(result.isMobile).toBe(true);
  });

  it("handles a null user agent without throwing", () => {
    expect(() => parseUserAgent(null)).not.toThrow();
  });
});
