import { describe, expect, it } from "vitest";
import { useOfflineDispatchStore } from "@/store/offline-dispatch";

describe("offline-dispatch store", () => {
  it("records slot mapping and resolves it", () => {
    useOfflineDispatchStore.getState().setSlot("dev-1", 4);
    expect(useOfflineDispatchStore.getState().slotFor("dev-1")).toBe(4);
    expect(useOfflineDispatchStore.getState().slotFor("missing")).toBeNull();
  });
  it("appends to outbox, persists, and clears by ticketId", () => {
    useOfflineDispatchStore.getState().appendOutbox({
      ticketId: "t1",
      action: "SERVE",
      at: "2026-06-24T00:00:00Z",
    });
    expect(
      JSON.parse(localStorage.getItem("offlineDispatch") ?? "{}").outbox,
    ).toHaveLength(1);
    useOfflineDispatchStore.getState().clearOutbox(["t1"]);
    expect(useOfflineDispatchStore.getState().outbox).toHaveLength(0);
  });
});
