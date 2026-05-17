// --- Message envelope types ---

export interface SerialRequest {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
}

export interface SerialResponse {
  id: string;
  type: "response";
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

export interface SerialEvent {
  id: null;
  type: string;
  payload: Record<string, unknown>;
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
  firmware_version: string;
  mac: string;
}

export interface IdentifyPayload {
  public_id: string;
  device_name: string;
  op_state: string;
  firmware_version: string;
  mac: string;
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

export interface RestartResult {
  restarting: true;
}

export interface PingResult {
  uptime_ms: number;
}

// --- Serial command type union ---

export type SerialCommandType =
  | "ping"
  | "identify"
  | "status"
  | "provision"
  | "provision.test_wifi"
  | "update_mqtt"
  | "factory_reset"
  | "transmit"
  | "lifecycle";

// --- Serial event type constants ---

export type SerialEventType =
  | "event.wifi_connected"
  | "event.wifi_disconnected"
  | "event.mqtt_connected"
  | "event.mqtt_disconnected"
  | "event.activated"
  | "event.lifecycle_changed"
  | "event.dispatch_ok"
  | "event.dispatch_rejected";

// --- Hardware constants ---

export const ESP32_C3_USB_FILTER = {
  usbVendorId: 0x303a,
  usbProductId: 0x1001,
} as const;

export const SERIAL_BAUD_RATE = 115200;
export const SERIAL_COMMAND_TIMEOUT_MS = 10_000;
export const SERIAL_SESSION_POLL_INTERVAL_MS = 30_000;
