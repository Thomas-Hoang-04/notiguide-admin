"use client";

import { Ban, Loader2, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { DeviceDetailDto, DeviceLifecycleRequest } from "@/types/device";
import { lifecycleAction } from "./api";

interface LifecyclePanelProps {
  device: DeviceDetailDto;
  onUpdate: (device: DeviceDetailDto) => void;
}

type LifecycleActionType = DeviceLifecycleRequest["action"];

export function LifecyclePanel({ device, onUpdate }: LifecyclePanelProps) {
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const [confirmAction, setConfirmAction] =
    useState<LifecycleActionType | null>(null);
  const [loading, setLoading] = useState(false);

  const isPassive = device.kind === "RECEIVER_433M_PASSIVE";
  const isHub = device.kind === "TRANSMITTER_HUB";
  const isDecommissioned = device.status === "DECOMMISSIONED";
  const isRejected = device.status === "REJECTED";
  const isSuspended = device.status === "SUSPENDED";

  async function handleAction() {
    if (loading || !confirmAction) return;
    setLoading(true);
    try {
      const updated = await lifecycleAction(device.id, {
        action: confirmAction,
      });
      const toastKey =
        confirmAction === "suspend"
          ? "lifecycle.suspendedToast"
          : confirmAction === "resume"
            ? "lifecycle.resumedToast"
            : "lifecycle.decommissionedToast";
      toast.success(tDevices(toastKey));
      setConfirmAction(null);
      onUpdate(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  function getConfirmTitle(): string {
    if (confirmAction === "suspend") return tDevices("lifecycle.suspendTitle");
    if (confirmAction === "resume") return tDevices("lifecycle.resumeTitle");
    return tDevices("lifecycle.decommissionTitle");
  }

  function getConfirmDescription(): string {
    if (confirmAction === "suspend")
      return tDevices("lifecycle.suspendDescription");
    if (confirmAction === "resume")
      return tDevices("lifecycle.resumeDescription");
    return tDevices("lifecycle.decommissionDescription");
  }

  const isDestructive = confirmAction === "decommission";

  const lifecycleCmd = device.lifecycleCommand;

  return (
    <>
      <div className="glass-card rounded-xl p-6">
        <h2 className="mb-2 text-lg font-semibold">
          {tDevices("lifecycle.title")}
        </h2>

        {isPassive && (
          <p className="mb-4 text-xs text-muted-foreground">
            {tDevices("lifecycle.passiveSubtitle")}
          </p>
        )}
        {isHub && (
          <p className="mb-4 text-xs text-muted-foreground">
            {tDevices("lifecycle.hubSubtitle")}
          </p>
        )}

        {lifecycleCmd && lifecycleCmd.ackStatus === "PENDING" && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            {tDevices("lifecycle.commandPending")}
          </div>
        )}

        {lifecycleCmd && lifecycleCmd.ackStatus !== "PENDING" && (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {lifecycleCmd.action === "suspend"
                ? tDevices("lifecycle.suspendButton")
                : lifecycleCmd.action === "resume"
                  ? tDevices("lifecycle.resumeButton")
                  : tDevices("lifecycle.decommissionButton")}
              :
            </span>
            <Badge variant="outline" className="border-border text-xs">
              {tDevices(
                `lifecycle.commandAck.${lifecycleCmd.ackStatus}` as
                  | "lifecycle.commandAck.PENDING"
                  | "lifecycle.commandAck.OK"
                  | "lifecycle.commandAck.IGNORED"
                  | "lifecycle.commandAck.REJECTED",
              )}
            </Badge>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {isSuspended ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction("resume")}
              disabled={isDecommissioned || isRejected}
            >
              <Play aria-hidden="true" className="mr-1.5 size-4" />
              {tDevices("lifecycle.resumeButton")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction("suspend")}
              disabled={
                isDecommissioned ||
                isRejected ||
                device.status === "PENDING" ||
                device.status === "PENDING_RF_CODE"
              }
            >
              <Pause aria-hidden="true" className="mr-1.5 size-4" />
              {tDevices("lifecycle.suspendButton")}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("decommission")}
            disabled={isDecommissioned || isRejected}
            className="text-destructive hover:text-destructive"
          >
            <Ban aria-hidden="true" className="mr-1.5 size-4" />
            {tDevices("lifecycle.decommissionButton")}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(v) => {
          if (!v) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getConfirmTitle()}</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleAction();
              }}
              disabled={loading}
              className={
                isDestructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary-hover"
              }
            >
              {loading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {confirmAction === "suspend"
                ? tDevices("lifecycle.suspendButton")
                : confirmAction === "resume"
                  ? tDevices("lifecycle.resumeButton")
                  : tDevices("lifecycle.decommissionButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
