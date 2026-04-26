"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearDeclinedThisSession,
  type ConsentBrowserKind,
  detectBrowserKind,
  getApiOrigin,
  isRequestStorageAccessForSupported,
  isSameOriginApi,
  queryTopLevelStorageAccess,
  rememberDeclined,
  requestStorageAccessForOrigin,
  wasDeclinedThisSession,
} from "@/lib/storage-access";

// State machine for the cross-site cookie consent UX.
//
// `idle`         — initial / no preemptive action required (Permissions API
//                  could not decide, no prior decline; we wait for positive
//                  evidence before nagging the user)
// `same-origin`  — admin web and API share an origin; consent isn't applicable
// `granted`      — Permissions API confirms `top-level-storage-access` granted
// `needed`       — Permissions API reports `prompt`; auto path is attemptable
// `manual`       — Permissions API reports `denied`, OR auto path failed,
//                  OR the browser doesn't implement requestStorageAccessFor
// `acknowledged` — user followed manual instructions and dismissed; do NOT
//                  show the warning banner (their action wasn't a decline)
// `declined`     — user dismissed without acting; show the reopen banner
export type ConsentStatus =
  | "idle"
  | "same-origin"
  | "granted"
  | "needed"
  | "manual"
  | "acknowledged"
  | "declined";

interface CookieConsentState {
  status: ConsentStatus;
  apiOrigin: string | null;
  browser: ConsentBrowserKind;
  request: () => Promise<boolean>;
  decline: () => void;
  acknowledge: () => void;
  reopen: () => Promise<void>;
  // Called when we have evidence that cookies didn't stick (e.g., the post-login
  // session-verification ping returned 401). Surfaces the dialog with the most
  // appropriate mode for the current platform — re-querying the Permissions API
  // so a user already known to be `denied` stays in manual mode rather than
  // bouncing back to the auto path that already failed.
  reportFailure: () => Promise<void>;
}

// Pure resolver — single source of truth for status from environment + flags.
// Used by initial mount, reopen, and reportFailure so reactivation paths
// honor the current Permissions API verdict instead of forgetting it.
async function resolveStatusFor(
  origin: string,
  options: { honorDeclinedFlag: boolean; biasTowardDialog: boolean },
): Promise<ConsentStatus> {
  const permissionState = await queryTopLevelStorageAccess(origin);

  if (permissionState === "granted") return "granted";

  if (options.honorDeclinedFlag && wasDeclinedThisSession()) return "declined";

  // Positive evidence from the Permissions API — route to the matching mode.
  if (permissionState === "denied") return "manual";
  if (permissionState === "prompt" && isRequestStorageAccessForSupported()) {
    return "needed";
  }

  // No evidence: stay idle on initial mount; show *something* on explicit
  // reactivation (banner click, login verification failure).
  if (!options.biasTowardDialog) return "idle";
  return isRequestStorageAccessForSupported() ? "needed" : "manual";
}

export function useCookieConsent(): CookieConsentState {
  const [status, setStatus] = useState<ConsentStatus>("idle");
  const [apiOrigin, setApiOrigin] = useState<string | null>(null);
  const [browser, setBrowser] = useState<ConsentBrowserKind>("unknown");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (isSameOriginApi()) {
        if (!cancelled) setStatus("same-origin");
        return;
      }
      const origin = getApiOrigin();
      if (!origin) {
        if (!cancelled) setStatus("same-origin");
        return;
      }
      if (!cancelled) {
        setApiOrigin(origin);
        setBrowser(detectBrowserKind());
      }

      const next = await resolveStatusFor(origin, {
        honorDeclinedFlag: true,
        biasTowardDialog: false,
      });
      if (!cancelled) setStatus(next);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    if (!apiOrigin) return false;
    if (!isRequestStorageAccessForSupported()) {
      setStatus("manual");
      return false;
    }
    const ok = await requestStorageAccessForOrigin(apiOrigin);
    // On failure (user denied the browser-native prompt, or the (admin, api)
    // pair isn't in a Related Website Set so Chrome rejects without UI),
    // fall through to manual instructions instead of looping.
    setStatus(ok ? "granted" : "manual");
    return ok;
  }, [apiOrigin]);

  const decline = useCallback(() => {
    rememberDeclined();
    setStatus("declined");
  }, []);

  const acknowledge = useCallback(() => {
    // User claimed they applied the manual fix. Don't mark as declined —
    // hide the banner and let the next login attempt prove whether cookies
    // now flow. If they don't, `reportFailure` re-opens the dialog.
    clearDeclinedThisSession();
    setStatus("acknowledged");
  }, []);

  const reopen = useCallback(async () => {
    if (!apiOrigin) return;
    clearDeclinedThisSession();
    const next = await resolveStatusFor(apiOrigin, {
      honorDeclinedFlag: false,
      biasTowardDialog: true,
    });
    setStatus(next);
  }, [apiOrigin]);

  const reportFailure = useCallback(async () => {
    if (!apiOrigin) return;
    clearDeclinedThisSession();
    const next = await resolveStatusFor(apiOrigin, {
      honorDeclinedFlag: false,
      biasTowardDialog: true,
    });
    setStatus(next);
  }, [apiOrigin]);

  return {
    status,
    apiOrigin,
    browser,
    request,
    decline,
    acknowledge,
    reopen,
    reportFailure,
  };
}
