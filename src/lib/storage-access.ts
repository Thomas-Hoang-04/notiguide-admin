"use client";

/**
 * Helpers for `requestStorageAccessFor` (Chromium-only, gated by Related Website Sets).
 * Without RWS the call rejects silently, so callers must fall back to manual instructions
 * for non-RWS deployments and for Firefox/Safari, which don't implement the top-level API.
 */
import { API_BASE_URL } from "@/lib/constants";
import { parseUserAgent } from "@/lib/user-agent";

const CONSENT_DECLINED_KEY = "notiguide.cookieConsent.declined";
const CONSENT_VERIFIED_KEY = "notiguide.cookieConsent.verified";

export type ConsentBrowserKind =
  | "chromium"
  | "firefox"
  | "safari"
  | "other"
  | "unknown";

export function getApiOrigin(): string | null {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return null;
  }
}

export function isSameOriginApi(): boolean {
  if (typeof window === "undefined") return false;
  const origin = getApiOrigin();
  return origin !== null && origin === window.location.origin;
}

export function isRequestStorageAccessForSupported(): boolean {
  return (
    typeof document !== "undefined" && "requestStorageAccessFor" in document
  );
}

// Promise-style wrapper around document.requestStorageAccessFor.
// MUST be invoked from a user-gesture handler (click) — the browser rejects otherwise.
export async function requestStorageAccessForOrigin(
  origin: string,
): Promise<boolean> {
  if (!isRequestStorageAccessForSupported()) return false;
  try {
    const doc = document as Document & {
      requestStorageAccessFor?: (origin: string) => Promise<void>;
    };
    await doc.requestStorageAccessFor?.(origin);
    return true;
  } catch {
    return false;
  }
}

type StorageAccessPermissionState = "granted" | "denied" | "prompt" | "unknown";

// Permissions API status for the top-level `requestStorageAccessFor` API.
// MDN documents the permission name as `top-level-storage-access` (distinct from the
// iframe `storage-access` permission used by `requestStorageAccess`).
// Returns "unknown" when the platform cannot answer (no Permissions API support, or
// the browser doesn't recognize this permission name — which itself signals the
// requestStorageAccessFor flow isn't available there).
export async function queryTopLevelStorageAccess(
  origin: string,
): Promise<StorageAccessPermissionState> {
  if (typeof navigator === "undefined" || !("permissions" in navigator)) {
    return "unknown";
  }
  try {
    const status = await navigator.permissions.query({
      name: "top-level-storage-access",
      requestedOrigin: origin,
    } as unknown as PermissionDescriptor);
    if (status.state === "granted") return "granted";
    if (status.state === "denied") return "denied";
    if (status.state === "prompt") return "prompt";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function detectBrowserKind(): ConsentBrowserKind {
  if (typeof navigator === "undefined") return "unknown";
  const { browser } = parseUserAgent(navigator.userAgent ?? null);
  switch (browser) {
    case "Chrome":
    case "Edge":
    case "Opera":
      return "chromium";
    case "Firefox":
      return "firefox";
    case "Safari":
      return "safari";
    case "Unknown":
      return "unknown";
    default:
      return "other";
  }
}

export function rememberDeclined(): void {
  try {
    sessionStorage.setItem(CONSENT_DECLINED_KEY, "1");
  } catch {
    // sessionStorage may be unavailable (privacy mode) — degrade silently.
  }
}

export function wasDeclinedThisSession(): boolean {
  try {
    return sessionStorage.getItem(CONSENT_DECLINED_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearDeclinedThisSession(): void {
  try {
    sessionStorage.removeItem(CONSENT_DECLINED_KEY);
  } catch {
    // ignore
  }
}

// Persistent "we've already seen cookies actually work in this browser" flag.
// The Permissions API for `top-level-storage-access` only flips to "granted"
// after a per-origin grant via requestStorageAccessFor (which itself is gated
// by Related Website Sets in Chrome). Users who have globally enabled
// third-party cookies can sign in successfully even though that permission
// stays at "prompt" forever — without this flag, the resolver would route
// them back to the dialog on every page load. Persisted in localStorage so
// the evidence outlives a tab close; cleared by `reportFailure` once a real
// post-login cookie-missing signal proves the previous evidence is stale.
export function rememberCookieAccessVerified(): void {
  try {
    localStorage.setItem(CONSENT_VERIFIED_KEY, "1");
  } catch {
    // localStorage may be unavailable (privacy mode) — degrade silently.
  }
}

export function wasCookieAccessVerified(): boolean {
  try {
    return localStorage.getItem(CONSENT_VERIFIED_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearCookieAccessVerified(): void {
  try {
    localStorage.removeItem(CONSENT_VERIFIED_KEY);
  } catch {
    // ignore
  }
}
