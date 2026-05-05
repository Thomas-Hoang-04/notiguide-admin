"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SyntheticEvent, useEffect, useState } from "react";
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
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { listStores } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";
import type { StoreDto } from "@/types/store";
import { approveDevice } from "./api";

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceDto | null;
  onSuccess: () => void;
}

export function ApproveDialog({
  open,
  onOpenChange,
  device,
  onSuccess,
}: ApproveDialogProps) {
  const { admin, isSuperAdmin, storeId: adminStoreId } = useAuthStore();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const [assignedName, setAssignedName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && device) {
      setAssignedName(device.assignedName ?? "");
      setErrors({});
      if (isSuperAdmin) {
        setStoreId(device.storeId ?? "");
        listStores(0, 100)
          .then((res) => setStores(res.items))
          .catch(() => toast.error(tQueue("failedToLoadStores")));
      } else {
        setStoreId(adminStoreId ?? "");
      }
    }
  }, [open, device, isSuperAdmin, adminStoreId, tQueue]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!assignedName.trim()) {
      errs.assignedName = tDevices("pending.approveNameRequired");
    }
    if (!storeId) {
      errs.storeId = tDevices("pending.approveStoreRequired");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleApprove(e: SyntheticEvent) {
    e.preventDefault();
    if (loading || !device) return;
    if (!validate()) return;

    setLoading(true);
    try {
      await approveDevice(device.id, {
        assignedName: assignedName.trim(),
        storeId,
      });
      toast.success(tDevices("pending.approvedToast"));
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 409 && err.error === "hub_cap_reached") {
          toast.error(tDevices("pending.errorHubCapReached"));
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

  const isHub = device?.kind === "TRANSMITTER_HUB";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleApprove} noValidate>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tDevices("pending.approveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tDevices("pending.approveDescription")}
            </AlertDialogDescription>
            {isHub && (
              <p className="text-xs text-warning">
                {tDevices("hub.approveSubtitle")}
              </p>
            )}
          </AlertDialogHeader>

          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-name">
                {tDevices("pending.approveNameLabel")}
              </Label>
              <Input
                id="approve-name"
                value={assignedName}
                onChange={(e) => setAssignedName(e.target.value)}
                maxLength={100}
                aria-invalid={!!errors.assignedName}
              />
              {errors.assignedName && (
                <InlineError message={errors.assignedName} className="mt-1" />
              )}
            </div>

            {isSuperAdmin ? (
              <div className="space-y-2">
                <Label>{tDevices("pending.approveStoreLabel")}</Label>
                <Select
                  value={storeId}
                  onValueChange={(v) => v && setStoreId(v)}
                >
                  <SelectTrigger
                    className="h-10 w-full gap-2 px-3"
                    aria-invalid={!!errors.storeId}
                  >
                    <span>
                      {storeId
                        ? (stores.find((s) => s.id === storeId)?.name ??
                          tCommon("unknown"))
                        : tDevices("pending.approveStorePlaceholder")}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="p-1.5"
                  >
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="py-2">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.storeId && (
                  <InlineError message={errors.storeId} className="mt-1" />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{tDevices("pending.approveStoreLabel")}</Label>
                <Input
                  value={admin?.storeName ?? tCommon("unknown")}
                  disabled
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                void handleApprove(e);
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
              {tDevices("pending.approveButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
