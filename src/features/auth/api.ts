import { post } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { LoginRequest, LoginResponse } from "@/types/admin";

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
