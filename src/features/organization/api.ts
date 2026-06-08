import { get, post } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { JoinCodeResponse, OrganizationDto } from "@/types/organization";

export function getMyOrg() {
  return get<OrganizationDto>(API_ROUTES.ORGS.ME);
}

export function getOrgJoinCode() {
  return get<JoinCodeResponse>(API_ROUTES.ORGS.JOIN_CODE);
}

export function rotateOrgJoinCode() {
  return post<JoinCodeResponse>(API_ROUTES.ORGS.JOIN_CODE_ROTATE, undefined);
}

export function getStoreJoinCode(storeId: string) {
  return get<JoinCodeResponse>(API_ROUTES.STORES.JOIN_CODE(storeId));
}

export function rotateStoreJoinCode(storeId: string) {
  return post<JoinCodeResponse>(
    API_ROUTES.STORES.JOIN_CODE_ROTATE(storeId),
    undefined,
  );
}
