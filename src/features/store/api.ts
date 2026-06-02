import { del, get, post, put } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
  CreateServiceTypeRequest,
  CreateSlugRequest,
  CreateStoreRequest,
  ServiceTypeDto,
  StoreDto,
  StorePageResponse,
  StoreSlugDto,
  StoreSlugListResponse,
  UpdateServiceTypeRequest,
  UpdateStoreRequest,
} from "@/types/store";

export function listStores(page = 0, size = 20) {
  return get<StorePageResponse>(
    `${API_ROUTES.STORES.BASE}?page=${page}&size=${size}`,
  );
}

export function getStore(id: string) {
  return get<StoreDto>(API_ROUTES.STORES.BY_ID(id));
}

export function createStore(request: CreateStoreRequest) {
  return post<StoreDto>(API_ROUTES.STORES.BASE, request);
}

export function updateStore(id: string, request: UpdateStoreRequest) {
  return put<StoreDto>(API_ROUTES.STORES.BY_ID(id), request);
}

export function deleteStore(id: string) {
  return del<void>(API_ROUTES.STORES.BY_ID(id));
}

export function listServiceTypes(storeId: string) {
  return get<ServiceTypeDto[]>(API_ROUTES.STORES.SERVICE_TYPES(storeId));
}

export function createServiceType(
  storeId: string,
  request: CreateServiceTypeRequest,
) {
  return post<ServiceTypeDto>(
    API_ROUTES.STORES.SERVICE_TYPES(storeId),
    request,
  );
}

export function updateServiceType(
  storeId: string,
  id: string,
  request: UpdateServiceTypeRequest,
) {
  return put<ServiceTypeDto>(
    API_ROUTES.STORES.SERVICE_TYPE(storeId, id),
    request,
  );
}

export function deleteServiceType(storeId: string, id: string) {
  return del<void>(API_ROUTES.STORES.SERVICE_TYPE(storeId, id));
}

export function listSlugs(storeId: string) {
  return get<StoreSlugListResponse>(API_ROUTES.STORES.SLUGS(storeId));
}

export function createSlug(storeId: string, request: CreateSlugRequest) {
  return post<StoreSlugDto>(API_ROUTES.STORES.SLUGS(storeId), request);
}

export function retireSlug(storeId: string, slug: string) {
  return post<StoreSlugDto>(API_ROUTES.STORES.SLUG_RETIRE(storeId, slug), {});
}

export function removeSlug(storeId: string, slug: string) {
  return del<void>(API_ROUTES.STORES.SLUG(storeId, slug));
}
