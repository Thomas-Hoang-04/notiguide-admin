import { describe, expect, it } from "vitest";
import {
  isConfirmEnabled,
  isStoreRequired,
} from "@/features/admin/approve-join-request-logic";

describe("isStoreRequired", () => {
  it("requires a store for an org admin", () => {
    expect(isStoreRequired(true, "ROLE_ADMIN")).toBe(true);
  });
  it("does not require a store for a super admin", () => {
    expect(isStoreRequired(true, "ROLE_SUPER_ADMIN")).toBe(false);
  });
  it("does not require a store for an independent-store admin", () => {
    expect(isStoreRequired(false, "ROLE_ADMIN")).toBe(false);
  });
});

describe("isConfirmEnabled", () => {
  it("disables confirm for an org admin until a store is chosen", () => {
    expect(isConfirmEnabled(true, "ROLE_ADMIN", "")).toBe(false);
    expect(isConfirmEnabled(true, "ROLE_ADMIN", "store-1")).toBe(true);
  });
  it("enables confirm for a super admin without a store", () => {
    expect(isConfirmEnabled(true, "ROLE_SUPER_ADMIN", "")).toBe(true);
  });
  it("enables confirm for an independent-store admin without a store", () => {
    expect(isConfirmEnabled(false, "ROLE_ADMIN", "")).toBe(true);
  });
  it("enables confirm for a super admin regardless of allowRoleChoice", () => {
    expect(isConfirmEnabled(false, "ROLE_SUPER_ADMIN", "")).toBe(true);
  });
});
