import { del, get, patch, post } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
  AdminDto,
  AdminPageResponse,
  AdminSessionDto,
  CreateAdminRequest,
  LoginHistoryPageResponse,
  UpdatePasswordRequest,
  UpdateUsernameRequest,
} from "@/types/admin";

export function listAdmins(
  page = 0,
  size = 20,
  storeId?: string | null,
  role?: string | null,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (storeId) {
    params.set("storeId", storeId);
  }
  if (role) {
    params.set("role", role);
  }
  return get<AdminPageResponse>(`${API_ROUTES.ADMINS.BASE}?${params}`);
}

export function createAdmin(request: CreateAdminRequest) {
  return post<AdminDto>(API_ROUTES.ADMINS.BASE, request);
}

export function verifyAdmin(id: string) {
  return patch<AdminDto>(API_ROUTES.ADMINS.VERIFY(id));
}

export function deleteAdmin(id: string) {
  return del<void>(API_ROUTES.ADMINS.BY_ID(id));
}

export function updateAdminStore(id: string, storeId: string | null) {
  return patch<AdminDto>(API_ROUTES.ADMINS.STORE(id), { storeId });
}

export function updateUsername(id: string, request: UpdateUsernameRequest) {
  return patch<AdminDto>(API_ROUTES.ADMINS.USERNAME(id), request);
}

export function updatePassword(id: string, request: UpdatePasswordRequest) {
  return patch<AdminDto>(API_ROUTES.ADMINS.PASSWORD(id), request);
}

export function getMe() {
  return get<AdminDto>(API_ROUTES.ADMINS.ME);
}

export function getLoginHistory(adminId: string, limit = 20) {
  return get<LoginHistoryPageResponse>(
    API_ROUTES.ADMINS.LOGIN_HISTORY(adminId, limit),
  );
}

export function listSessions(adminId: string) {
  return get<AdminSessionDto[]>(API_ROUTES.ADMINS.SESSIONS(adminId));
}

export function revokeSession(adminId: string, sessionId: string) {
  return del<void>(API_ROUTES.ADMINS.SESSION(adminId, sessionId));
}
