"use client";

import { create } from "zustand";
import { logout as logoutRequest } from "@/features/auth/api";
import { get } from "@/lib/api";
import {
  clearStoredAuthAndRedirect,
  clearStoredAuthState,
} from "@/lib/auth-session";
import { API_ROUTES, ROLES } from "@/lib/constants";
import type { AdminDto, LoginResponse } from "@/types/admin";

interface AuthState {
  admin: AdminDto | null;
  isHydrated: boolean;

  // Derived
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  storeId: string | null;

  // Actions
  login: (response: LoginResponse) => void;
  logout: () => Promise<void>;
  updateAdmin: (admin: AdminDto) => void;
  hydrate: () => Promise<void>;
}

function deriveState(admin: AdminDto | null) {
  return {
    isAuthenticated: admin !== null,
    isSuperAdmin: admin?.role === ROLES.SUPER_ADMIN,
    storeId: admin?.storeId ?? null,
  };
}

let isHydrating = false;

export const useAuthStore = create<AuthState>()((set, getState) => ({
  admin: null,
  isHydrated: false,
  isAuthenticated: false,
  isSuperAdmin: false,
  storeId: null,

  login: (response: LoginResponse) => {
    localStorage.setItem("admin", JSON.stringify(response.admin));
    set({
      admin: response.admin,
      ...deriveState(response.admin),
    });
  },

  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Local logout should still proceed if the cookie clear request fails.
    } finally {
      set({
        admin: null,
        ...deriveState(null),
      });
      clearStoredAuthAndRedirect();
    }
  },

  updateAdmin: (admin: AdminDto) => {
    localStorage.setItem("admin", JSON.stringify(admin));
    set({
      admin,
      ...deriveState(admin),
    });
  },

  hydrate: async () => {
    if (isHydrating) return;
    isHydrating = true;

    const wasHydrated = getState().isHydrated;

    // On first hydrate, set initial state from localStorage for instant UI
    if (!wasHydrated) {
      const adminJson = localStorage.getItem("admin");
      let admin: AdminDto | null = null;
      if (adminJson) {
        try {
          admin = JSON.parse(adminJson);
        } catch {
          // Corrupt localStorage data
        }
      }

      set({
        admin,
        ...deriveState(admin),
      });
    }

    // Fetch fresh state from backend
    try {
      const freshAdmin = await get<AdminDto>(API_ROUTES.ADMINS.ME);
      set({
        admin: freshAdmin,
        ...deriveState(freshAdmin),
        isHydrated: true,
      });
      localStorage.setItem("admin", JSON.stringify(freshAdmin));
    } catch {
      // 401 will be caught by api.ts and redirect to login
      clearStoredAuthState();
      set({
        admin: null,
        ...deriveState(null),
        isHydrated: true,
      });
    } finally {
      isHydrating = false;
    }
  },
}));
