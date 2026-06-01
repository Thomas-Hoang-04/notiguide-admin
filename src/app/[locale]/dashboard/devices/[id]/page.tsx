"use client";

import { ArrowLeft, Loader2, Radio, RotateCcw, Usb } from "lucide-react";
import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDevice, reprovisionDevice } from "@/features/device/api";
import { DeviceStatusBadge } from "@/features/device/device-status-badge";
import { DispatchedTicketPanel } from "@/features/device/dispatched-ticket-panel";
import { HubDiagnosticsPanel } from "@/features/device/hub-diagnostics-panel";
import { LifecyclePanel } from "@/features/device/lifecycle-panel";
import { RfCodeEditor } from "@/features/device/rf-code-editor";
import { UsbControlPanel } from "@/features/device/usb-control-panel";
import { UsbDispatchDialog } from "@/features/device/usb-dispatch-dialog";
import { useDeviceAckPoll } from "@/features/device/use-device-ack-poll";
import { Link } from "@/i18n/navigation";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useSerial } from "@/lib/serial/use-serial";
import { ApiError } from "@/types/api";
import type { DeviceDetailDto } from "@/types/device";

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const serial = useSerial();
  const tUsb = useTranslations("devices.usb");

  const [device, setDevice] = useState<DeviceDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprovisionOpen, setReprovisionOpen] = useState(false);
  const [reprovisionLoading, setReprovisionLoading] = useState(false);
  const [usbDispatchOpen, setUsbDispatchOpen] = useState(false);

  const fetchDevice = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const result = await getDevice(params.id);
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

  const { polling } = useDeviceAckPoll(device, setDevice);

  const isHub = device?.kind === "TRANSMITTER_HUB";
  const isPassive = device?.kind === "RECEIVER_433M_PASSIVE";
  const isReceiver = device !== null && !isHub;
  const showRfCode =
    isReceiver && device.rfCode !== null && device.hubSlot == null;
  const showReprovision =
    device !== null &&
    !isPassive &&
    device.hubSlot == null &&
    device.status !== "DECOMMISSIONED" &&
    device.status !== "REJECTED";
  const showLifecycle =
    device !== null &&
    device.status !== "PENDING" &&
    device.status !== "PENDING_RF_CODE";
  const showDispatchPanel =
    device !== null &&
    device.status !== "PENDING" &&
    device.status !== "PENDING_RF_CODE" &&
    device.status !== "DECOMMISSIONED" &&
    device.status !== "REJECTED";
  const serialPublicId = serial.deviceState?.public_id?.trim();
  const serialMatchesDevice =
    !!serialPublicId &&
    !!device?.publicId &&
    serialPublicId === device.publicId;

  async function handleReprovision() {
    if (reprovisionLoading || !device) return;
    setReprovisionLoading(true);
    try {
      const updated = await reprovisionDevice(device.id);
      toast.success(tDevices("reprovision.successToast"));
      setReprovisionOpen(false);
      setDevice(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setReprovisionLoading(false);
    }
  }

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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/devices"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
          <span className="text-lg font-semibold text-primary">
            {tDevices("title")}
          </span>
        </div>
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
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
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
          {device.hubSlot != null && (
            <div>
              <p className="text-xs text-muted-foreground">
                {tDevices("detail.pairingMode")}
              </p>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                {tDevices("hubPaired")} · Slot {device.hubSlot}
              </Badge>
            </div>
          )}
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

      {/* USB Connect + Control Panel — hub only */}
      {isHub && serial.canUseSerial && (
        <>
          {serial.portState === "closed" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void serial.connect()}
              >
                <Usb aria-hidden="true" className="mr-1.5 size-4" />
                {tUsb("connect")}
              </Button>
            </div>
          )}
          {serial.portState === "open" && (
            <>
              <UsbControlPanel
                serial={serial}
                deviceId={device.id}
                backendMqttConnected={
                  device.status === "ACTIVE" || device.status === "SUSPENDED"
                }
                expectedPublicId={device.publicId}
              />
              {device.storeId &&
                serial.deviceState?.op_state === "ACTIVE" &&
                serialMatchesDevice && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsbDispatchOpen(true)}
                    >
                      <Radio aria-hidden="true" className="mr-1.5 size-4" />
                      {tUsb("test_dispatch")}
                    </Button>
                  </div>
                )}
            </>
          )}
        </>
      )}

      {/* Diagnostics Panel — hub only */}
      {isHub && showDispatchPanel && (
        <HubDiagnosticsPanel device={device} onUpdate={setDevice} />
      )}

      {/* RF Code Panel — receivers only (not rendered for hubs per §9.9.2) */}
      {showRfCode && (
        <RfCodeEditor device={device} onUpdate={setDevice} polling={polling} />
      )}

      {/* Lifecycle Panel */}
      {showLifecycle && <LifecyclePanel device={device} onUpdate={setDevice} />}

      {/* Dispatched Ticket Panel */}
      {showDispatchPanel && <DispatchedTicketPanel device={device} />}

      {/* Reprovision Action */}
      {showReprovision && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReprovisionOpen(true)}
            className="text-warning hover:text-warning"
          >
            <RotateCcw aria-hidden="true" className="mr-1.5 size-4" />
            {tDevices("reprovision.button")}
          </Button>
        </div>
      )}

      {/* USB Dispatch Dialog */}
      {isHub &&
        device.storeId &&
        serial.portState === "open" &&
        serialMatchesDevice && (
          <UsbDispatchDialog
            open={usbDispatchOpen}
            onOpenChange={setUsbDispatchOpen}
            storeId={device.storeId}
            sendCommand={serial.sendCommand}
          />
        )}

      {/* Reprovision Confirmation */}
      <AlertDialog open={reprovisionOpen} onOpenChange={setReprovisionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDevices("reprovision.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {isHub
                ? tDevices("reprovision.hubDescription")
                : tDevices("reprovision.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reprovisionLoading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleReprovision();
              }}
              disabled={reprovisionLoading}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {reprovisionLoading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tDevices("reprovision.button")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
