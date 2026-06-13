import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { approveJoinRequest } from "@/features/admin/api";
import { post } from "@/lib/api";

describe("approveJoinRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the role and store id to the approve route", () => {
    approveJoinRequest("req-1", "ROLE_ADMIN", "store-9");
    expect(post).toHaveBeenCalledWith("/api/admins/requests/req-1/approve", {
      role: "ROLE_ADMIN",
      storeId: "store-9",
    });
  });

  it("omits the store id for a super-admin approval", () => {
    approveJoinRequest("req-2", "ROLE_SUPER_ADMIN");
    expect(post).toHaveBeenCalledWith("/api/admins/requests/req-2/approve", {
      role: "ROLE_SUPER_ADMIN",
      storeId: undefined,
    });
  });
});
