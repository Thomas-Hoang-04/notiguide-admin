export type DeviceStatus =
  | "PENDING"
  | "PENDING_RF_CODE"
  | "ACTIVE"
  | "SUSPENDED"
  | "DECOMMISSIONED"
  | "REJECTED";

export type DeviceKind =
  | "RECEIVER_433M"
  | "RECEIVER_433M_PASSIVE"
  | "RECEIVER_2_4G"
  | "TRANSMITTER_HUB";

export type DeviceRfAckStatus =
  | "PENDING"
  | "APPLIED"
  | "UNCHANGED"
  | "REJECTED";

export interface DeviceRfCodeSummaryDto {
  bits: number;
  byteLen: number;
  version: number;
  ack: DeviceRfAckStatus;
  issuedAt: string;
  ackAt: string | null;
}

export interface DeviceDto {
  id: string;
  publicId: string | null;
  kind: DeviceKind;
  status: DeviceStatus;
  assignedName: string | null;
  storeId: string | null;
  storeName: string | null;
  firmwareVersion: string | null;
  lastSeenAt: string | null;
  activatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  rfCode: DeviceRfCodeSummaryDto | null;
  hubSlot: number | null;
}

export interface DeviceListResponse {
  devices: DeviceDto[];
  registered: number | null;
}

export interface EnrollmentTokenIssueResponse {
  token: string;
  tokenHash: string;
  expiresAt: string;
}

export interface EnrollmentTokenMetadataDto {
  tokenHash: string;
  storeId: string | null;
  issuedAt: string;
  expiresAt: string;
}

export interface IssueEnrollmentTokenRequest {
  storeId?: string | null;
}

export interface PassiveDeviceRegistrationRequest {
  kind: "RECEIVER_433M_PASSIVE";
  assignedName: string;
  storeId: string;
  rfCodeHex: string;
  rfCodeBits: 16;
}

export type DeviceLifecycleAckStatus =
  | "PENDING"
  | "OK"
  | "IGNORED"
  | "REJECTED";

export interface BoundTicketDto {
  ticketId: string;
  ticketNumber: string;
  status: string;
}

export interface HubDiagnosticsDto {
  freeHeapPct: number;
  rssi: number | null;
  uptimeMs: number;
  dispatchDaily: number;
  dispatchTotal: number;
  wifiConnected: boolean | null;
  ip: string | null;
  firmwareVersion: string | null;
  source: "MQTT" | "USB";
  updatedAt: string;
}

export interface HubHealthSummaryResponse {
  totalHubs: number;
  onlineHubs: number;
  offlineHubs: number;
  warnings: HubWarningDto[];
}

export interface HubWarningDto {
  deviceId: string;
  deviceName: string | null;
  type: "LOW_MEMORY" | "WEAK_SIGNAL" | "LONG_UPTIME";
  value: string;
}

export interface DeviceDiagnosticsRelayRequest {
  publicId: string;
  freeHeapPct: number;
  rssi: number | null;
  uptimeMs: number;
  dispatchDaily: number;
  dispatchTotal: number;
  wifiConnected: boolean;
  ip: string | null;
  firmwareVersion: string | null;
}

export interface DeviceDetailDto extends DeviceDto {
  lifecycleCommand?: {
    commandId: string;
    action: string;
    ackStatus: DeviceLifecycleAckStatus;
    issuedAt: string;
  } | null;
  isElected?: boolean | null;
  boundTicket?: BoundTicketDto | null;
  diagnostics?: HubDiagnosticsDto | null;
}

export interface ApproveDeviceRequest {
  assignedName: string;
  storeId: string;
}

export interface RotateRfCodeRequest {
  rfCodeBits?: number;
}

export interface DeviceLifecycleRequest {
  action: "suspend" | "resume" | "decommission";
}

export interface UsbDispatchPayloadRequest {
  storeId: string;
  deviceId: string;
  action: "call" | "stop";
}

export interface UsbDispatchPayloadResponse {
  receiverPublicId: string;
  band: "433M" | "2_4G";
  rfCodeHex: string;
  rfCodeBits: number;
  protoAny: boolean;
}
