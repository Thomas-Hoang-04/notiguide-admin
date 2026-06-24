export type SerialDispatchAction = "call" | "stop";

export type SerialDispatchPlan =
  | { kind: "slot"; slot: number; action: SerialDispatchAction }
  | { kind: "payload"; action: SerialDispatchAction };

export function buildSerialDispatch(
  device: { hubSlot: number | null },
  action: SerialDispatchAction,
): SerialDispatchPlan {
  if (device.hubSlot != null) {
    return { kind: "slot", slot: device.hubSlot, action };
  }
  return { kind: "payload", action };
}
