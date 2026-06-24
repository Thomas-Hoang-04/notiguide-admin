"use client";

import { useCallback } from "react";
import { getUsbDispatchPayload } from "@/features/device/api";
import {
  buildSerialDispatch,
  type SerialDispatchAction,
} from "@/lib/dispatch/serial-command";
import type { TransmitResult } from "@/lib/serial/types";
import type { UseSerialReturn } from "@/lib/serial/use-serial";

export function useSerialDispatch(storeId: string, serial: UseSerialReturn) {
  return useCallback(
    async (
      target: { id: string; hubSlot: number | null },
      action: SerialDispatchAction,
    ): Promise<TransmitResult> => {
      const plan = buildSerialDispatch({ hubSlot: target.hubSlot }, action);
      if (plan.kind === "slot") {
        return serial.sendCommand("transmit_slot", {
          slot: plan.slot,
          action: plan.action,
        });
      }
      const payload = await getUsbDispatchPayload({
        storeId,
        deviceId: target.id,
        action: plan.action,
      });
      return serial.sendCommand("transmit", {
        receiver_public_id: payload.receiverPublicId,
        band: payload.band,
        rf_code_hex: payload.rfCodeHex,
        rf_code_bits: payload.rfCodeBits,
        proto_any: payload.protoAny,
      });
    },
    [storeId, serial],
  );
}
