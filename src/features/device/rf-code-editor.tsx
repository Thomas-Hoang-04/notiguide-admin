"use client";

import { Loader2, RotateCcw } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { DeviceDetailDto } from "@/types/device";
import { rotateRfCode } from "./api";

interface RfCodeEditorProps {
  device: DeviceDetailDto;
  onUpdate: (device: DeviceDetailDto) => void;
  polling: boolean;
}

export function RfCodeEditor({ device, onUpdate, polling }: RfCodeEditorProps) {
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const [rotateOpen, setRotateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPassive = device.kind === "RECEIVER_433M_PASSIVE";
  const rfCode = device.rfCode;

  if (!rfCode) return null;

  async function handleRotate() {
    if (loading) return;
    setLoading(true);
    try {
      const updated = await rotateRfCode(device.id);
      toast.success(tDevices("rfCode.rotatedToast"));
      setRotateOpen(false);
      onUpdate(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 400 && err.error === "hardware_fixed_code") {
          toast.error(tDevices("rfCode.errorHardwareFixed"));
        } else if (err.code === 400 && err.error === "hub_no_rf_code") {
          toast.error(tDevices("rfCode.errorHubNoRfCode"));
        } else {
          toast.error(translateCommonApiError(err, tErrors));
        }
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  const ackBadgeClass =
    rfCode.ack === "APPLIED"
      ? "border-success/30 bg-success/10 text-success"
      : rfCode.ack === "REJECTED"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20";

  return (
    <>
      <div className="glass-card rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{tDevices("rfCode.title")}</h2>
          {!isPassive && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotateOpen(true)}
                    disabled={polling}
                    aria-label={tDevices("rfCode.rotateButton")}
                  />
                }
              >
                <RotateCcw aria-hidden="true" className="mr-1.5 size-4" />
                {tDevices("rfCode.rotateButton")}
              </TooltipTrigger>
              <TooltipContent>{tDevices("rfCode.rotateButton")}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="grid gap-4 s:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.rfBits")}
            </p>
            <p className="text-sm">{rfCode.bits}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.rfVersion")}
            </p>
            <p className="text-sm">v{rfCode.version}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tDevices("detail.rfAck")}
            </p>
            <Badge variant="outline" className={ackBadgeClass}>
              {tDevices(`rfCode.ack.${rfCode.ack}`)}
            </Badge>
          </div>
          {isPassive && (
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

        {isPassive && (
          <p className="mt-3 text-xs text-muted-foreground">
            {tDevices("rfCode.lockedNote")}
          </p>
        )}

        {polling && rfCode.ack === "PENDING" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            {tDevices("rfCode.polling")}
          </div>
        )}
      </div>

      <AlertDialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tDevices("rfCode.rotateTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tDevices("rfCode.rotateDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRotate();
              }}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              {loading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tDevices("rfCode.rotateButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
