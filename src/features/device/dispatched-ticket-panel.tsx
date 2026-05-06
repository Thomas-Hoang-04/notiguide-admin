"use client";

import { Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { DeviceDetailDto } from "@/types/device";

interface DispatchedTicketPanelProps {
  device: DeviceDetailDto;
}

export function DispatchedTicketPanel({ device }: DispatchedTicketPanelProps) {
  const tDevices = useTranslations("devices");

  const isHub = device.kind === "TRANSMITTER_HUB";
  const bound = device.boundTicket;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-lg font-semibold">
        {tDevices("dispatch.title")}
      </h2>

      {isHub ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{tDevices("hub.recentDispatches.note")}</p>
          <p>{tDevices("hub.recentDispatches.empty")}</p>
        </div>
      ) : bound ? (
        <div className="flex items-center gap-3">
          <Radio aria-hidden="true" className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">
              {tDevices("dispatch.boundTicket", { number: bound.ticketNumber })}
            </p>
            <Badge
              variant="outline"
              className="mt-1 border-action/30 bg-action/10 text-xs text-action"
            >
              {bound.status}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Radio aria-hidden="true" className="size-5" />
          <p className="text-sm">{tDevices("dispatch.placeholder")}</p>
        </div>
      )}
    </div>
  );
}
