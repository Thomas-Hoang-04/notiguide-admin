import { describe, expect, it } from "vitest";
import { buildSerialDispatch } from "@/lib/dispatch/serial-command";

describe("buildSerialDispatch", () => {
  it("hub-paired receiver → slot plan", () => {
    expect(buildSerialDispatch({ hubSlot: 3 }, "call")).toEqual({
      kind: "slot",
      slot: 3,
      action: "call",
    });
  });
  it("standalone receiver → payload plan", () => {
    expect(buildSerialDispatch({ hubSlot: null }, "stop")).toEqual({
      kind: "payload",
      action: "stop",
    });
  });
});
