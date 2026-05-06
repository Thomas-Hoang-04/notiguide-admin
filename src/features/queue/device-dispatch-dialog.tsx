"use client";

import { Loader2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";
import { getAvailableDevices, issueDeviceTicket } from "./api";

interface DeviceDispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onSuccess: () => void;
}

export function DeviceDispatchDialog({
  open,
  onOpenChange,
  storeId,
  onSuccess,
}: DeviceDispatchDialogProps) {
  const tQueue = useTranslations("queue");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedDeviceId("");
    setFetching(true);
    getAvailableDevices(storeId)
      .then((res) => {
        setDevices(res.devices);
        if (res.devices.length === 1) {
          setSelectedDeviceId(res.devices[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [open, storeId]);

  async function handleDispatch() {
    if (loading || !selectedDeviceId) return;
    setLoading(true);
    try {
      const ticket = await issueDeviceTicket(storeId, {
        deviceId: selectedDeviceId,
      });
      toast.success(tQueue("dispatch.successToast", { number: ticket.number }));
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.error === "no_active_transmitter") {
          toast.error(tQueue("dispatch.errorNoActiveTransmitter"));
        } else if (err.error === "device_busy") {
          toast.error(tQueue("dispatch.errorDeviceBusy"));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tQueue("dispatch.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {tQueue("dispatch.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          <Label>{tQueue("dispatch.deviceLabel")}</Label>
          {fetching ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            </div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tQueue("dispatch.disabledNoDevice")}
            </p>
          ) : (
            <Select
              value={selectedDeviceId}
              onValueChange={(v) => setSelectedDeviceId(v ?? "")}
            >
              <SelectTrigger className="h-10 w-full gap-2 px-3">
                <SelectValue>
                  {(value: string | null) => {
                    const match = devices.find((d) => d.id === value);
                    return match ? (
                      <span className="flex items-center gap-2">
                        <Radio aria-hidden="true" className="size-3.5" />
                        {match.assignedName || match.publicId}
                        <span className="text-xs text-muted-foreground">
                          {tDevices(`kind.${match.kind}`)}
                        </span>
                      </span>
                    ) : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="p-1.5"
              >
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="py-2">
                    <span className="flex items-center gap-2">
                      <Radio aria-hidden="true" className="size-3.5" />
                      {d.assignedName || d.publicId}
                      <span className="text-xs text-muted-foreground">
                        {tDevices(`kind.${d.kind}`)}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {tQueue("dispatch.cancel")}
          </Button>
          <Button
            onClick={() => void handleDispatch()}
            disabled={loading || !selectedDeviceId}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {loading && (
              <Loader2
                aria-hidden="true"
                className="mr-2 size-4 animate-spin"
              />
            )}
            {tQueue("dispatch.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
