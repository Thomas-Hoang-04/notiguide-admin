"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeviceStatusBadge } from "@/features/device/device-status-badge";
import { Link } from "@/i18n/navigation";
import { get } from "@/lib/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { API_ROUTES } from "@/lib/constants";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";

interface DeviceDetailDto extends DeviceDto {
  lifecycleCommand?: {
    commandId: string;
    action: string;
    ackStatus: string;
    issuedAt: string;
  } | null;
}

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const [device, setDevice] = useState<DeviceDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDevice = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const result = await get<DeviceDetailDto>(
        API_ROUTES.DEVICES.BY_ID(params.id),
      );
      setDevice(result);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, tErrors]);

  useEffect(() => {
    void fetchDevice();
  }, [fetchDevice]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="glass-card rounded-xl p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/devices"
          className="text-sm text-primary hover:underline"
        >
          {tDevices("title")}
        </Link>
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          {tErrors("notFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/devices"
          className="text-sm text-primary hover:underline"
        >
          {tDevices("title")}
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold">
          {device.assignedName || device.publicId || tCommon("unknown")}
        </h1>
      </div>

      {/* Identity Panel */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {tDevices("detail.identity")}
        </h2>
        <div className="grid gap-4 s:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.publicId")}
            </p>
            <p className="font-mono text-sm">
              {device.publicId || tCommon("none")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.assignedName")}
            </p>
            <p className="text-sm">{device.assignedName || tCommon("none")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.kind")}
            </p>
            <Badge variant="outline" className="border-border">
              {tDevices(`kind.${device.kind}`)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.hardware")}
            </p>
            <p className="text-sm">{device.hardwareModel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.status")}
            </p>
            <DeviceStatusBadge status={device.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.store")}
            </p>
            <p className="text-sm">{device.storeName || tCommon("none")}</p>
          </div>
          {device.firmwareVersion && (
            <div>
              <p className="text-xs text-muted-foreground">
                {tDevices("detail.firmware")}
              </p>
              <p className="font-mono text-sm">{device.firmwareVersion}</p>
            </div>
          )}
          {device.activatedAt && (
            <div>
              <p className="text-xs text-muted-foreground">
                {tDevices("detail.activatedAt")}
              </p>
              <p className="text-sm">
                {format.dateTime(new Date(device.activatedAt), {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </p>
            </div>
          )}
          {device.createdAt && (
            <div>
              <p className="text-xs text-muted-foreground">
                {tDevices("detail.createdAt")}
              </p>
              <p className="text-sm">
                {format.dateTime(new Date(device.createdAt), {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RF Code Panel — read-only for passive devices */}
      {device.kind !== "TRANSMITTER_HUB" && device.rfCode && (
        <div className="glass-card rounded-xl p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {tDevices("detail.rfCode")}
          </h2>
          <div className="grid gap-4 s:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                {tDevices("detail.rfBits")}
              </p>
              <p className="text-sm">{device.rfCode.bits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {tDevices("detail.rfVersion")}
              </p>
              <p className="text-sm">v{device.rfCode.version}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {tDevices("detail.rfAck")}
              </p>
              <Badge
                variant="outline"
                className={
                  device.rfCode.ack === "APPLIED"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20"
                }
              >
                {tDevices(`rfCode.ack.${device.rfCode.ack}`)}
              </Badge>
            </div>
            {device.kind === "RECEIVER_433M_PASSIVE" && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {tDevices("detail.rfValue")}
                </p>
                <Badge variant="outline" className="font-mono border-border">
                  {tDevices("rfCode.maskedValue")}
                </Badge>
              </div>
            )}
          </div>
          {device.kind === "RECEIVER_433M_PASSIVE" && (
            <p className="mt-3 text-xs text-muted-foreground">
              {tDevices("rfCode.lockedNote")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
