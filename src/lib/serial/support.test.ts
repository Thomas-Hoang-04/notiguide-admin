import { describe, expect, it } from "vitest";
import { hasWebSerialSupport } from "@/lib/serial/support";

describe("hasWebSerialSupport", () => {
  it("is false in a non-browser (node) environment without window", () => {
    // The "node" test environment has no `window`, so the capability check short-circuits to false.
    expect(hasWebSerialSupport()).toBe(false);
  });
});
