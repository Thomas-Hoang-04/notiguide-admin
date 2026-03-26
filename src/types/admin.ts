export type AdminRole = "ROLE_ADMIN" | "ROLE_SUPER_ADMIN";

export interface AdminDto {
  id: string;
  username: string;
  role: AdminRole;
  storeId: string | null;
  storeName: string | null;
  isVerified: boolean;
  createdBy: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  admin: AdminDto;
  sessionId?: string;
}

export interface CreateAdminRequest {
  username: string;
  password: string;
  role: AdminRole;
  storeId: string | null;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AdminPageResponse {
  items: AdminDto[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface LoginHistoryDto {
  id: string;
  ipAddress: string;
  success: boolean;
  createdAt: string | null;
}

export interface LoginHistoryPageResponse {
  items: LoginHistoryDto[];
  hasMore: boolean;
}

export interface AdminSessionDto {
  id: string;
  ipAddress: string;
  userAgent: string | null;
  lastActive: string | null;
  createdAt: string | null;
  isCurrent: boolean;
}
