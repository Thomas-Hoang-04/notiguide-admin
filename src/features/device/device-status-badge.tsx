"use client";

import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { DeviceStatus } from "@/types/device";
import React from "react";

const statusStyles: Record<DeviceStatus, string> = {
  PENDING:
    "border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20",
  PENDING_RF_CODE:
    "border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20",
  ACTIVE: "border-success/30 bg-success/10 text-success",
  SUSPENDED:
    "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground",
  DECOMMISSIONED: "border-destructive/30 bg-destructive/10 text-destructive",
  REJECTED: "border-destructive/30 bg-destructive/10 text-destructive",
};

const statusIcons: Partial<Record<DeviceStatus, React.ReactNode>> = {
  ACTIVE: <CheckCircle aria-hidden="true" className="mr-1 size-3" />,
  PENDING: <Clock aria-hidden="true" className="mr-1 size-3" />,
  PENDING_RF_CODE: <Clock aria-hidden="true" className="mr-1 size-3" />,
  REJECTED: <XCircle aria-hidden="true" className="mr-1 size-3" />,
};

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
}

export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const tDevices = useTranslations("devices");

  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {statusIcons[status]}
      {tDevices(`status.${status}`)}
    </Badge>
  );
}
