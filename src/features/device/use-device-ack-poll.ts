"use client";

import { useEffect, useRef } from "react";
import type { DeviceDetailDto } from "@/types/device";
import { getDevice } from "./api";

const POLL_INTERVAL = 5_000;

export function useDeviceAckPoll(
  device: DeviceDetailDto | null,
  onUpdate: (device: DeviceDetailDto) => void,
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const shouldPoll =
    device !== null &&
    (device.status === "PENDING_RF_CODE" ||
      device.rfCode?.ack === "PENDING" ||
      device.lifecycleCommand?.ackStatus === "PENDING");

  useEffect(() => {
    if (!shouldPoll || !device) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const deviceId = device.id;

    timerRef.current = setInterval(async () => {
      try {
        const updated = await getDevice(deviceId);
        onUpdateRef.current(updated);
      } catch {
        // Silently ignore poll errors — next tick retries
      }
    }, POLL_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [shouldPoll, device?.id, device]);

  return { polling: shouldPoll };
}
