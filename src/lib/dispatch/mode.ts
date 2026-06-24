export type DispatchMode =
  | "ONLINE_MQTT"
  | "ONLINE_SERIAL_FALLBACK"
  | "OFFLINE_SERIAL"
  | "DISABLED";

export interface DispatchSignals {
  backendReachable: boolean;
  dispatchReady: boolean;
  hubConnectedForStore: boolean;
}

export function deriveDispatchMode(signals: DispatchSignals): DispatchMode {
  const { backendReachable, dispatchReady, hubConnectedForStore } = signals;
  if (!backendReachable) {
    return hubConnectedForStore ? "OFFLINE_SERIAL" : "DISABLED";
  }
  if (dispatchReady) return "ONLINE_MQTT";
  return hubConnectedForStore ? "ONLINE_SERIAL_FALLBACK" : "DISABLED";
}
