import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/organization/api", () => ({
  getOrgInviteLink: vi.fn(),
  rotateOrgInviteLink: vi.fn(),
  getStoreInviteLink: vi.fn(),
  rotateStoreInviteLink: vi.fn(),
}));

import {
  getOrgInviteLink,
  getStoreInviteLink,
  rotateOrgInviteLink,
  rotateStoreInviteLink,
} from "@/features/organization/api";
import { resolveInviteConfig } from "@/features/organization/invite-config";

describe("resolveInviteConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the org invite pair for a super-admin", () => {
    const config = resolveInviteConfig(true, null, undefined);
    expect(config).not.toBeNull();
    expect(config?.fetchLink).toBe(getOrgInviteLink);
    expect(config?.generateLink).toBe(rotateOrgInviteLink);
  });

  it("returns store-scoped closures when a store manager's store has no org", () => {
    const config = resolveInviteConfig(false, "store-1", null);
    expect(config).not.toBeNull();
    config?.fetchLink();
    config?.generateLink();
    expect(getStoreInviteLink).toHaveBeenCalledWith("store-1");
    expect(rotateStoreInviteLink).toHaveBeenCalledWith("store-1");
  });

  it("returns null while the store's org is still loading (undefined)", () => {
    expect(resolveInviteConfig(false, "store-1", undefined)).toBeNull();
  });

  it("returns null when the store belongs to an org", () => {
    expect(resolveInviteConfig(false, "store-1", "org-1")).toBeNull();
  });

  it("returns null for a store manager with no store", () => {
    expect(resolveInviteConfig(false, null, null)).toBeNull();
  });
});
