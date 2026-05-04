import { del, get, post } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
  DeviceDto,
  DeviceListResponse,
  EnrollmentTokenIssueResponse,
  EnrollmentTokenMetadataDto,
  IssueEnrollmentTokenRequest,
  PassiveDeviceRegistrationRequest,
} from "@/types/device";

export function listDevices(kind?: string | null, storeId?: string | null) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (storeId) params.set("storeId", storeId);
  const qs = params.toString();
  return get<DeviceListResponse>(
    `${API_ROUTES.DEVICES.BASE}${qs ? `?${qs}` : ""}`,
  );
}

export function issueEnrollmentToken(request: IssueEnrollmentTokenRequest) {
  return post<EnrollmentTokenIssueResponse>(API_ROUTES.DEVICES.TOKENS, request);
}

export function listEnrollmentTokens() {
  return get<EnrollmentTokenMetadataDto[]>(API_ROUTES.DEVICES.TOKENS);
}

export function revokeEnrollmentToken(sha256: string) {
  return del<void>(API_ROUTES.DEVICES.TOKEN_BY_HASH(sha256));
}

export function registerPassiveDevice(
  request: PassiveDeviceRegistrationRequest,
) {
  return post<DeviceDto>(API_ROUTES.DEVICES.PASSIVE, request);
}
