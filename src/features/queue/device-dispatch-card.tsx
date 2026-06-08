"use client";

import { Loader2, Radio, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeviceDto } from "@/types/device";

interface DeviceDispatchCardProps {
  device: DeviceDto;
  dispatchReady: boolean;
  dispatching: boolean;
  onDispatch: (deviceId: string) => void;
}

export function DeviceDispatchCard({
  device,
  dispatchReady,
  dispatching,
  onDispatch,
}: DeviceDispatchCardProps) {
  const tQueue = useTranslations("queue");
  const tDevices = useTranslations("devices");

  const name = device.assignedName || device.publicId || "";

  return (
    <div className="queue-device-card glass-panel glass-panel-primary flex items-center justify-between gap-3 rounded-lg px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Radio aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {tDevices(`kind.${device.kind}`)}
        </span>
      </div>

      {dispatchReady ? (
        <Button
          size="sm"
          disabled={dispatching}
          onClick={() => onDispatch(device.id)}
          className="shrink-0 gap-1.5 bg-action text-action-foreground hover:bg-action-hover"
        >
          {dispatching ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="size-3.5" />
          )}
          {tQueue("dispatch.dispatchButton")}
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                disabled
                aria-label={tQueue("dispatch.dispatchButton")}
                className="shrink-0 gap-1.5 bg-action text-action-foreground hover:bg-action-hover"
              >
                <Send aria-hidden="true" className="size-3.5" />
                {tQueue("dispatch.dispatchButton")}
              </Button>
            }
          />
          <TooltipContent>{tQueue("dispatch.disabledNoHub")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
