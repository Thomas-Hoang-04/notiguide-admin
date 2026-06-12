import { get, post } from "@/lib/api";
import { API_BASE_URL, API_ROUTES } from "@/lib/constants";
import type {
  InviteResolveResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types/admin";

export function login(request: LoginRequest) {
  return post<LoginResponse>(API_ROUTES.AUTH.LOGIN, request, {
    skipAuth: true,
  });
}

export function logout() {
  return post<void>(API_ROUTES.AUTH.LOGOUT, undefined, {
    skipAuth: true,
  });
}

export function register(request: RegisterRequest) {
  return post<RegisterResponse>(API_ROUTES.AUTH.REGISTER, request, {
    skipAuth: true,
  });
}

export function resolveInvite(token: string) {
  return get<InviteResolveResponse>(API_ROUTES.AUTH.INVITE(token), {
    skipAuth: true,
  });
}

// Discriminated outcome for the post-login session-verification ping.
// `cookie-missing` is the ONLY value that should drive the consent dialog —
// every other failure mode means something else went wrong and pushing the
// user toward the cookie-fix path would be misleading remediation.
export type VerifySessionResult =
  | { kind: "ok" }
  | { kind: "cookie-missing"; status: number }
  | { kind: "server-error"; status: number }
  | { kind: "other-http"; status: number }
  | { kind: "network" };

// Bypasses the regular api() helper because we DO NOT want its 401 → silent
// refresh → clearStoredAuthAndRedirect side effect during the post-login
// verification. We just need to learn whether the session cookie reached
// the next request and, if not, what kind of failure we saw.
export async function verifySession(): Promise<VerifySessionResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${API_ROUTES.ADMINS.ME}`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    return { kind: "network" };
  }
  if (res.ok) return { kind: "ok" };
  // 401 immediately after a 200 from /api/auth/login is the precise signal
  // that the Set-Cookie did not survive the round-trip — that's the cookie
  // remediation path. 403 here would mean an authz quirk unrelated to
  // cookies and should not push the user toward enabling cookies.
  if (res.status === 401) return { kind: "cookie-missing", status: 401 };
  if (res.status >= 500) return { kind: "server-error", status: res.status };
  return { kind: "other-http", status: res.status };
}

export async function abortLogin(abortToken: string): Promise<void> {
  // Best-effort cleanup of server-side artifacts (session, refresh token,
  // login_history row) created by a login whose Set-Cookie did not stick.
  // The backend keeps the abort token usable until every cleanup step
  // succeeds, so a bounded second pass can finish a transient partial rollback
  // without changing the visible login flow for the user.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await fetch(`${API_BASE_URL}${API_ROUTES.AUTH.ABORT}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abortToken }),
      });
    } catch {
      // ignore — if the request never left the browser, the next pass may.
    }
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
}
