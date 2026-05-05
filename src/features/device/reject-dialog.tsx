"use client";

import { Loader2 } from "lucide-react";
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
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";
import { rejectDevice } from "./api";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceDto | null;
  onSuccess: () => void;
}

export function RejectDialog({
  open,
  onOpenChange,
  device,
  onSuccess,
}: RejectDialogProps) {
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const [loading, setLoading] = useState(false);

  async function handleReject() {
    if (loading || !device) return;
    setLoading(true);
    try {
      await rejectDevice(device.id);
      toast.success(tDevices("pending.rejectedToast"));
      onOpenChange(false);
      onSuccess();
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tDevices("pending.rejectTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tDevices("pending.rejectDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleReject();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && (
              <Loader2
                aria-hidden="true"
                className="mr-2 size-4 animate-spin"
              />
            )}
            {tDevices("pending.rejectButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
