"use client";

import { useMemo } from "react";
import { type DispatchMode, deriveDispatchMode } from "@/lib/dispatch/mode";
import type { UseSerialReturn } from "@/lib/serial/use-serial";

export function useDispatchMode(args: {
  reachable: boolean;
  dispatchReady: boolean;
  serial: UseSerialReturn;
}): DispatchMode {
  const { reachable, dispatchReady, serial } = args;
  const hubConnectedForStore =
    serial.portState === "open" &&
    serial.identifyPayload?.device_kind === "TRANSMITTER_HUB" &&
    serial.deviceState?.op_state === "ACTIVE";
  return useMemo(
    () =>
      deriveDispatchMode({
        backendReachable: reachable,
        dispatchReady,
        hubConnectedForStore: !!hubConnectedForStore,
      }),
    [reachable, dispatchReady, hubConnectedForStore],
  );
}
