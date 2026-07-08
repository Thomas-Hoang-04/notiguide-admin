import { del, get, patch, post } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
  ApproveDeviceRequest,
  DeviceDetailDto,
  DeviceDiagnosticsRelayRequest,
  DeviceDto,
  DeviceLifecycleRequest,
  DeviceListResponse,
  EnrollmentTokenIssueResponse,
  EnrollmentTokenMetadataDto,
  HubHealthSummaryResponse,
  IssueEnrollmentTokenRequest,
  PassiveDeviceRegistrationRequest,
  RenameDeviceRequest,
  RosterRelayRequest,
  RotateRfCodeRequest,
  UsbDispatchPayloadRequest,
  UsbDispatchPayloadResponse,
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

export function getDevice(id: string) {
  return get<DeviceDetailDto>(API_ROUTES.DEVICES.BY_ID(id));
}

export function approveDevice(id: string, request: ApproveDeviceRequest) {
  return post<DeviceDetailDto>(API_ROUTES.DEVICES.APPROVE(id), request);
}

export function rejectDevice(id: string) {
  return post<DeviceDetailDto>(API_ROUTES.DEVICES.REJECT(id));
}

export function rotateRfCode(id: string, request?: RotateRfCodeRequest) {
  return post<DeviceDetailDto>(API_ROUTES.DEVICES.RF_CODE(id), request ?? {});
}

export function lifecycleAction(id: string, request: DeviceLifecycleRequest) {
  return post<DeviceDetailDto>(API_ROUTES.DEVICES.LIFECYCLE(id), request);
}

export function reprovisionDevice(id: string) {
  return post<DeviceDetailDto>(API_ROUTES.DEVICES.REPROVISION(id));
}

export function getUsbDispatchPayload(request: UsbDispatchPayloadRequest) {
  return post<UsbDispatchPayloadResponse>(
    API_ROUTES.DEVICES.USB_DISPATCH_PAYLOAD,
    request,
  );
}

export function relayDiagnostics(
  id: string,
  data: DeviceDiagnosticsRelayRequest,
) {
  return post<void>(API_ROUTES.DEVICES.DIAGNOSTICS(id), data);
}

export function relayRoster(id: string, data: RosterRelayRequest) {
  return post<{ applied: boolean }>(API_ROUTES.DEVICES.ROSTER_RELAY(id), data);
}

export function renameDevice(id: string, request: RenameDeviceRequest) {
  return patch<DeviceDetailDto>(API_ROUTES.DEVICES.RENAME(id), request);
}

export function getHubHealth() {
  return get<HubHealthSummaryResponse>(API_ROUTES.DEVICES.HUB_HEALTH);
}
