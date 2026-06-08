import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/store/auth";
import type { AdminDto } from "@/types/admin";

const initial = useAuthStore.getState();
afterEach(() => useAuthStore.setState(initial, true));

describe("useAuthStore", () => {
  it("starts unauthenticated", () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("login sets authenticated + super-admin flags from the response", () => {
    const response = {
      admin: {
        id: "1",
        username: "root",
        role: "ROLE_SUPER_ADMIN",
        storeId: null,
        orgId: "o1",
      } as unknown as AdminDto,
      abortToken: "abort",
    };
    useAuthStore.getState().login(response as never);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isSuperAdmin).toBe(true);
  });
});
