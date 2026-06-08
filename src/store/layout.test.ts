import { afterEach, describe, expect, it } from "vitest";
import { useLayoutStore } from "@/store/layout";

const initial = useLayoutStore.getState();
afterEach(() => useLayoutStore.setState(initial, true));

describe("useLayoutStore", () => {
  it("sets and clears the page gradient class", () => {
    useLayoutStore.getState().setPageGradientClass("from-x to-y");
    expect(useLayoutStore.getState().pageGradientClass).toBe("from-x to-y");
    useLayoutStore.getState().clearPageGradientClass();
    expect(useLayoutStore.getState().pageGradientClass).toBe("");
  });
});
