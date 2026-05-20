"use client";

import { Check, Clock, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import type { DeviceDto } from "@/types/device";
import { ApproveDialog } from "./approve-dialog";
import { RejectDialog } from "./reject-dialog";

interface PendingReviewCardProps {
  devices: DeviceDto[] | null;
  loading: boolean;
  onActionComplete: () => void;
}

export function PendingReviewCard({
  devices,
  loading,
  onActionComplete,
}: PendingReviewCardProps) {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");

  const [approveTarget, setApproveTarget] = useState<DeviceDto | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DeviceDto | null>(null);

  const pendingDevices = devices?.filter(
    (d) => d.status === "PENDING" || d.status === "PENDING_RF_CODE",
  );

  if (!loading && (!pendingDevices || pendingDevices.length === 0)) {
    return null;
  }

  return (
    <>
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
              <div
                key={device.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <Link
                  href={`/dashboard/devices/${device.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-medium">
                    {device.assignedName ||
                      device.publicId ||
                      tCommon("unknown")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tDevices(`kind.${device.kind}`)}
                    {device.storeName && ` · ${device.storeName}`}
                  </p>
                </Link>

                <div className="ml-3 flex shrink-0 items-center gap-1">
                  <span className="mr-2 hidden text-xs text-muted-foreground s:inline">
                    {device.createdAt &&
                      format.dateTime(new Date(device.createdAt), {
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                  </span>

                  {device.status === "PENDING" && (
                    <>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={() => setApproveTarget(device)}
                              className="text-success hover:text-success"
                              aria-label={tDevices("pending.approveButton")}
                            />
                          }
                        >
                          <Check aria-hidden="true" className="size-5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {tDevices("pending.approveButton")}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={() => setRejectTarget(device)}
                              className="text-destructive hover:text-destructive"
                              aria-label={tDevices("pending.rejectButton")}
                            />
                          }
                        >
                          <X aria-hidden="true" className="size-5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {tDevices("pending.rejectButton")}
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {device.status === "PENDING_RF_CODE" && (
                    <span className="text-xs text-muted-foreground">
                      {tDevices("pending.waitingForDevice")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ApproveDialog
        open={!!approveTarget}
        onOpenChange={(v) => {
          if (!v) setApproveTarget(null);
        }}
        device={approveTarget}
        onSuccess={onActionComplete}
      />

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(v) => {
          if (!v) setRejectTarget(null);
        }}
        device={rejectTarget}
        onSuccess={onActionComplete}
      />
    </>
  );
}
