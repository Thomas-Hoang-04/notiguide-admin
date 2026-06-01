import type { DeviceKind } from "@/types/device";

// --- Message envelope types ---

export interface SerialResponse {
  id: string;
  type: "response";
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

// --- Command payload types ---

export interface ProvisionPayload {
  wifi_ssid: string;
  wifi_pwd?: string;
  mqtt_uri: string;
  mqtt_user: string;
  mqtt_pwd: string;
  enroll_token: string;
}

export interface TestWifiPayload {
  wifi_ssid: string;
  wifi_pwd?: string;
}

export interface UpdateMqttPayload {
  mqtt_uri: string;
  mqtt_user: string;
  mqtt_pwd: string;
}

export interface TransmitPayload {
  receiver_public_id?: string;
  band: "433M" | "2_4G";
  rf_code_hex: string;
  rf_code_bits: number;
  proto_any: boolean;
}

export interface LifecyclePayload {
  action: "suspend" | "resume" | "decommission";
}

// --- Response payload types ---

export interface StatusPayload {
  schema_version: number;
  provisioned: boolean;
  activated: boolean;
  recovery_required: boolean;
  wifi_connected: boolean;
  mqtt_connected: boolean;
  op_state: string;
  public_id: string;
  device_name: string;
  wifi_ssid?: string;
  wifi_rssi?: number;
  ip?: string;
  uptime_ms: number;
  free_heap: number;
  total_heap?: number;
  dispatch_daily?: number;
  dispatch_total?: number;
  firmware_version: string;
  mac: string;
}

export interface IdentifyPayload {
  public_id: string;
  device_name: string;
  device_kind: DeviceKind;
  op_state: string;
  firmware_version: string;
  mac: string;
}

export type { DeviceKind };

export function isReceiverKind(kind: DeviceKind): boolean {
  return kind !== "TRANSMITTER_HUB";
}

export interface TestWifiResult {
  connected: boolean;
  ip?: string;
  rssi?: number;
}

export interface TransmitResult {
  status: "applied" | "rejected";
  reason?: string;
  applied_at_ms?: number;
}

export interface LifecycleResult {
  op_state: string;
}

export interface RosterUnpairPayload {
  slot: number;
}

export interface RosterReceiver {
  slot: number;
  name: string;
  band: "433M" | "2_4G";
  mac: string;
  paired_at_ms: number;
}

export interface RosterListResult {
  count: number;
  max: number;
  receivers: RosterReceiver[];
}

export interface RosterUnpairResult {
  slot: number;
  removed_name: string;
}

export interface RestartResult {
  restarting: true;
}

export interface PingResult {
  uptime_ms: number;
}

// --- Command → payload/response type map ---

export interface SerialCommandMap {
  ping: { payload: undefined; response: PingResult };
  identify: { payload: undefined; response: IdentifyPayload };
  status: { payload: undefined; response: StatusPayload };
  provision: { payload: ProvisionPayload; response: RestartResult };
  "provision.test_wifi": { payload: TestWifiPayload; response: TestWifiResult };
  update_mqtt: { payload: UpdateMqttPayload; response: RestartResult };
  factory_reset: { payload: undefined; response: RestartResult };
  transmit: { payload: TransmitPayload; response: TransmitResult };
  lifecycle: { payload: LifecyclePayload; response: LifecycleResult };
  "roster.list": { payload: undefined; response: RosterListResult };
  "roster.unpair": {
    payload: RosterUnpairPayload;
    response: RosterUnpairResult;
  };
  retry: { payload: undefined; response: RestartResult };
}

// --- Hardware constants ---

export const ESP32_C3_USB_FILTER = {
  usbVendorId: 0x303a,
  usbProductId: 0x1001,
} as const;

export const FTDI_USB_FILTER = {
  usbVendorId: 0x0403,
  usbProductId: 0x6001,
} as const;

export const ALL_DEVICE_FILTERS = [
  ESP32_C3_USB_FILTER,
  FTDI_USB_FILTER,
] as const;

export const SERIAL_BAUD_RATE = 115200;
export const SERIAL_COMMAND_TIMEOUT_MS = 10_000;
export const SERIAL_SESSION_POLL_INTERVAL_MS = 30_000;
