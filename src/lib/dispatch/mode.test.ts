import { describe, expect, it } from "vitest";
import { deriveDispatchMode } from "@/lib/dispatch/mode";

describe("deriveDispatchMode", () => {
  it("offline + hub → OFFLINE_SERIAL", () => {
    expect(
      deriveDispatchMode({
        backendReachable: false,
        dispatchReady: false,
        hubConnectedForStore: true,
      }),
    ).toBe("OFFLINE_SERIAL");
  });
  it("offline + no hub → DISABLED", () => {
    expect(
      deriveDispatchMode({
        backendReachable: false,
        dispatchReady: true,
        hubConnectedForStore: false,
      }),
    ).toBe("DISABLED");
  });
  it("online + dispatchReady → ONLINE_MQTT (hub irrelevant)", () => {
    expect(
      deriveDispatchMode({
        backendReachable: true,
        dispatchReady: true,
        hubConnectedForStore: true,
      }),
    ).toBe("ONLINE_MQTT");
    expect(
      deriveDispatchMode({
        backendReachable: true,
        dispatchReady: true,
        hubConnectedForStore: false,
      }),
    ).toBe("ONLINE_MQTT");
  });
  it("online + not ready + hub → ONLINE_SERIAL_FALLBACK", () => {
    expect(
      deriveDispatchMode({
        backendReachable: true,
        dispatchReady: false,
        hubConnectedForStore: true,
      }),
    ).toBe("ONLINE_SERIAL_FALLBACK");
  });
  it("online + not ready + no hub → DISABLED", () => {
    expect(
      deriveDispatchMode({
        backendReachable: true,
        dispatchReady: false,
        hubConnectedForStore: false,
      }),
    ).toBe("DISABLED");
  });
});
