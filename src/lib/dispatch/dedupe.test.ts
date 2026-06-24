import { describe, expect, it } from "vitest";
import { createDispatchDedupe } from "@/lib/dispatch/dedupe";

describe("createDispatchDedupe", () => {
  it("admits a key once, rejects repeats within ttl", () => {
    const d = createDispatchDedupe(1000);
    expect(d.seen("t1:call:5", 0)).toBe(true);
    expect(d.seen("t1:call:5", 500)).toBe(false);
  });
  it("re-admits after ttl elapses", () => {
    const d = createDispatchDedupe(1000);
    expect(d.seen("k", 0)).toBe(true);
    expect(d.seen("k", 1500)).toBe(true);
  });
});
