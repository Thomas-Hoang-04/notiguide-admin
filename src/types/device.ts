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

export type DeviceHardwareModel = "ESP-01" | "ESP32-C3" | "PT2272";

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
  hardwareModel: DeviceHardwareModel;
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
  hardwareModel: "PT2272";
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

export interface DeviceDetailDto extends DeviceDto {
  lifecycleCommand?: {
    commandId: string;
    action: string;
    ackStatus: DeviceLifecycleAckStatus;
    issuedAt: string;
  } | null;
  isElected?: boolean | null;
  boundTicket?: BoundTicketDto | null;
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
