"use client";

import { Activity } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeviceDetailDto } from "@/types/device";
import { getDevice } from "./api";

interface HubHeartbeatPanelProps {
  device: DeviceDetailDto;
  onUpdate: (device: DeviceDetailDto) => void;
}

const HEARTBEAT_POLL_INTERVAL = 15_000;
const STALE_THRESHOLD_MS = 30_000;

function deriveLiveness(lastSeenAt: string | null): "alive" | "stale" {
  if (!lastSeenAt) return "stale";
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  return elapsed < STALE_THRESHOLD_MS ? "alive" : "stale";
}

export function HubHeartbeatPanel({
  device,
  onUpdate,
}: HubHeartbeatPanelProps) {
  const format = useFormatter();
  const tDevices = useTranslations("devices");

  const [liveness, setLiveness] = useState<"alive" | "stale">(() =>
    deriveLiveness(device.lastSeenAt),
  );
  const deviceRef = useRef(device);
  deviceRef.current = device;

  const poll = useCallback(async () => {
    try {
      const updated = await getDevice(deviceRef.current.id);
      onUpdate(updated);
      setLiveness(deriveLiveness(updated.lastSeenAt));
    } catch {
      // Silent — next poll will retry
    }
  }, [onUpdate]);

  useEffect(() => {
    setLiveness(deriveLiveness(device.lastSeenAt));
  }, [device.lastSeenAt]);

  useEffect(() => {
    const id = setInterval(() => void poll(), HEARTBEAT_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  const isAlive = liveness === "alive";
  const isElected = device.isElected;

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Heartbeat</h2>
      </div>

      <div className="grid gap-4 s:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Last heartbeat</p>
          {device.lastSeenAt ? (
            <p className="text-sm font-medium">
              {format.dateTime(new Date(device.lastSeenAt), {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
              })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs text-muted-foreground">Liveness</p>
          <Badge
            variant="outline"
            className={
              isAlive
                ? "border-success/40 bg-success/10 text-success"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }
          >
            {isAlive
              ? tDevices("hub.liveness.alive")
              : tDevices("hub.liveness.stale")}
          </Badge>
        </div>

        <div>
          <p className="mb-1 text-xs text-muted-foreground">Election</p>
          {isElected === undefined || isElected === null ? (
            <Skeleton className="h-5 w-20 rounded-full" />
          ) : (
            <Badge
              variant="outline"
              className={
                isElected
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border"
              }
            >
              {isElected
                ? tDevices("hub.election.elected")
                : tDevices("hub.election.standby")}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
