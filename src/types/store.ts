export interface StoreDto {
  id: string;
  publicId: string;
  name: string;
  address: string | null;
  isActive: boolean;
  allowJumpCall: boolean;
  allowNoShow: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateStoreRequest {
  name: string;
  address?: string;
  allowJumpCall?: boolean;
  allowNoShow?: boolean;
  maxQueueSize?: number;
  gracePeriodSec?: number;
  noShowAction?: string;
  maxRequeues?: number;
  requeueOffset?: number;
  alertThreshold?: number;
}

export interface UpdateStoreRequest {
  name?: string;
  address?: string | null;
  isActive?: boolean;
  allowJumpCall?: boolean;
  allowNoShow?: boolean;
}

export interface StorePageResponse {
  items: StoreDto[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface StoreSettingsDto {
  storeId: string;
  maxQueueSize: number;
  gracePeriodSec: number;
  noShowAction: string;
  maxRequeues: number;
  requeueOffset: number;
  alertThreshold: number;
  updatedAt: string | null;
}

export interface UpdateStoreSettingsRequest {
  maxQueueSize?: number;
  gracePeriodSec?: number;
  noShowAction?: string;
  maxRequeues?: number;
  requeueOffset?: number;
  alertThreshold?: number;
}

export interface ServiceTypeDto {
  id: string;
  storeId: string;
  name: string;
  prefix: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateServiceTypeRequest {
  name: string;
  prefix: string;
}

export interface UpdateServiceTypeRequest {
  name?: string;
  prefix?: string;
  isActive?: boolean;
}

export interface StoreSlugDto {
  slug: string;
  isDefault: boolean;
  status: "ACTIVE" | "GRACE";
  retiredAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export interface StoreSlugListResponse {
  items: StoreSlugDto[];
  activeCount: number;
  activeMax: number;
  graceCount: number;
  graceMax: number;
}

export interface CreateSlugRequest {
  slug: string;
  confirmAutoRetire?: boolean;
}
