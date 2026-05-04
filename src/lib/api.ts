"use client";

import { clearStoredAuthAndRedirect } from "@/lib/auth-session";
import { ApiError, type ErrorResponse, NetworkError } from "@/types/api";
import { API_BASE_URL, API_ROUTES } from "./constants";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

// Refresh mutex: ensures only one refresh request runs at a time.
// Other 401'd requests wait for the same refresh to complete, then retry.
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}${API_ROUTES.AUTH.REFRESH}`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function refreshOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = attemptRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response: Response;
  try {
    response = await doFetch();
  } catch {
    throw new NetworkError();
  }

  // On 401 for authenticated requests, try a silent refresh then retry once
  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      try {
        response = await doFetch();
      } catch {
        throw new NetworkError();
      }
    }

    // If refresh failed or the retried request is still 401, force logout
    if (!refreshed || response.status === 401) {
      fetch(`${API_BASE_URL}${API_ROUTES.AUTH.LOGOUT}`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      clearStoredAuthAndRedirect();
      throw new ApiError({
        timestamp: new Date().toISOString(),
        code: 401,
        error: "Unauthorized",
        message: "Session expired",
        path,
        method: options.method || "GET",
      });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let errorBody: ErrorResponse;
    try {
      errorBody = await response.json();
    } catch {
      throw new ApiError({
        timestamp: new Date().toISOString(),
        code: response.status,
        error: response.statusText,
        message: `Request failed with status ${response.status}`,
        path,
        method: options.method || "GET",
      });
    }

    if (!errorBody.code) {
      errorBody.code = response.status;
    }
    if (!errorBody.message) {
      errorBody.message = errorBody.error || response.statusText;
    }
    if (!errorBody.path) {
      errorBody.path = path;
    }
    if (!errorBody.method) {
      errorBody.method = options.method || "GET";
    }
    const apiError = new ApiError(errorBody);

    // 429 rate limit — compute seconds remaining from epoch timestamp
    if (response.status === 429) {
      const resetHeader = response.headers.get("X-RateLimit-Reset");
      if (resetHeader) {
        const resetEpoch = Number.parseInt(resetHeader, 10);
        if (!Number.isNaN(resetEpoch) && resetEpoch > 0) {
          apiError.rateLimitSeconds = Math.max(
            1,
            Math.ceil(resetEpoch - Date.now() / 1000),
          );
        }
      }
    }

    return Promise.reject(apiError);
  }

  return response.json();
}

// Convenience methods
export const get = <T>(path: string, opts?: RequestOptions) =>
  api<T>(path, { ...opts, method: "GET" });

export const post = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  api<T>(path, { ...opts, method: "POST", body });

export const put = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  api<T>(path, { ...opts, method: "PUT", body });

export const patch = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  api<T>(path, { ...opts, method: "PATCH", body });

export const del = <T>(path: string, opts?: RequestOptions) =>
  api<T>(path, { ...opts, method: "DELETE" });
