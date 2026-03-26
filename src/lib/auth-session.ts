"use client";

import { getLocalizedPath } from "@/i18n/locale";

export function clearStoredAuthState() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("admin");
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;

  window.location.href = getLocalizedPath("/login");
}

export function clearStoredAuthAndRedirect() {
  clearStoredAuthState();
  redirectToLogin();
}
