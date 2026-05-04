"use client";

import { Clock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { DeviceDto } from "@/types/device";

interface PendingReviewCardProps {
  devices: DeviceDto[] | null;
  loading: boolean;
}

export function PendingReviewCard({
  devices,
  loading,
}: PendingReviewCardProps) {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");

  const pendingDevices = devices?.filter(
    (d) => d.status === "PENDING" || d.status === "PENDING_RF_CODE",
  );

  if (!loading && (!pendingDevices || pendingDevices.length === 0)) {
    return null;
  }

  return (
    <div className="glass-card glass-card-hover glass-context-action rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock aria-hidden="true" className="size-5 text-warning" />
        <h2 className="font-semibold">{tDevices("pendingTitle")}</h2>
        {pendingDevices && (
          <Badge
            variant="outline"
            className="border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20"
          >
            {pendingDevices.length}
          </Badge>
        )}
      </div>

      {loading && !devices && (
        <div className="space-y-2">
          {["a", "b"].map((id) => (
            <Skeleton key={id} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {pendingDevices && (
        <div className="space-y-2">
          {pendingDevices.map((device) => (
            <Link
              key={device.id}
              href={`/dashboard/devices/${device.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {device.assignedName || device.publicId || tCommon("unknown")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tDevices(`kind.${device.kind}`)}
                  {device.storeName && ` · ${device.storeName}`}
                </p>
              </div>
              <div className="ml-3 shrink-0 text-right text-xs text-muted-foreground">
                {device.createdAt &&
                  format.dateTime(new Date(device.createdAt), {
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
