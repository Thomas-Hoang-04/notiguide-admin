import { describe, expect, it } from "vitest";
import {
  INITIAL_REACHABILITY,
  isReachable,
  reachabilityReducer,
} from "@/lib/dispatch/reachability";

describe("reachabilityReducer", () => {
  it("starts reachable", () => {
    expect(isReachable(INITIAL_REACHABILITY)).toBe(true);
  });
  it("stays reachable after a single failure (debounce)", () => {
    const s = reachabilityReducer(INITIAL_REACHABILITY, { type: "sse_error" });
    expect(isReachable(s)).toBe(true);
  });
  it("goes unreachable after 2 consecutive failures", () => {
    let s = reachabilityReducer(INITIAL_REACHABILITY, { type: "sse_error" });
    s = reachabilityReducer(s, { type: "api_error" });
    expect(isReachable(s)).toBe(false);
  });
  it("recovers immediately on sse_open", () => {
    let s = reachabilityReducer(INITIAL_REACHABILITY, { type: "sse_error" });
    s = reachabilityReducer(s, { type: "sse_error" });
    s = reachabilityReducer(s, { type: "sse_open" });
    expect(isReachable(s)).toBe(true);
  });
});
