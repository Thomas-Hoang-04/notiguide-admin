"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SyntheticEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { StoreDto } from "@/types/store";
import { registerPassiveDevice } from "./api";

interface PassiveDeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const HEX_PATTERN = /^[0-9A-Fa-f]+$/;

export function PassiveDeviceFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: PassiveDeviceFormDialogProps) {
  const { admin, isSuperAdmin, storeId: adminStoreId } = useAuthStore();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const [assignedName, setAssignedName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [rfCodeHex, setRfCodeHex] = useState("");
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setAssignedName("");
      setRfCodeHex("");
      setErrors({});
      if (isSuperAdmin) {
        setStoreId("");
        listStores(0, 100)
          .then((res) => setStores(res.items))
          .catch(() => toast.error(tQueue("failedToLoadStores")));
      } else {
        setStoreId(adminStoreId ?? "");
      }
    }
  }, [open, isSuperAdmin, adminStoreId, tQueue]);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!assignedName.trim()) {
      errs.assignedName = tDevices("passive.nameRequired");
    }

    if (!storeId) {
      errs.storeId = tDevices("passive.storeRequired");
    }

    if (!rfCodeHex.trim()) {
      errs.rfCodeHex = tDevices("passive.hexErrorFormat");
    } else if (!HEX_PATTERN.test(rfCodeHex)) {
      errs.rfCodeHex = tDevices("passive.hexErrorFormat");
    } else if (rfCodeHex.length !== 4) {
      errs.rfCodeHex = tDevices("passive.hexErrorLength");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await registerPassiveDevice({
        kind: "RECEIVER_433M_PASSIVE",
        assignedName: assignedName.trim(),
        storeId,
        rfCodeHex: rfCodeHex.toUpperCase(),
        rfCodeBits: 16,
      });
      toast.success(
        tDevices("passive.successToast", { publicId: result.publicId ?? "" }),
      );
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 409) {
          toast.error(tDevices("passive.errorConflict"));
        } else if (err.code === 403) {
          toast.error(tDevices("passive.errorForbidden"));
        } else if (err.code === 400) {
          const errorCode = err.error;
          if (errorCode === "pt2272_address_width_mismatch") {
            setErrors({
              rfCodeHex: tDevices(
                "passive.errors.pt2272_address_width_mismatch",
              ),
            });
          } else if (errorCode === "forbidden_pattern") {
            setErrors({
              rfCodeHex: tDevices("passive.errors.forbidden_pattern"),
            });
          } else if (errorCode === "width_out_of_range") {
            setErrors({
              rfCodeHex: tDevices("passive.errors.width_out_of_range"),
            });
          } else {
            toast.error(translateCommonApiError(err, tErrors));
          }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tDevices("passive.dialogTitle")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {tDevices("passive.dialogDescription")}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border">
              {tDevices("kind.RECEIVER_433M_PASSIVE")}
            </Badge>
            <Badge variant="outline" className="border-border">
              PT2272
            </Badge>
          </div>

          {isSuperAdmin ? (
            <div className="space-y-2">
              <Label>{tDevices("passive.storeLabel")}</Label>
              <Select value={storeId} onValueChange={(v) => v && setStoreId(v)}>
                <SelectTrigger
                  className="h-10 w-full gap-2 px-3"
                  aria-invalid={!!errors.storeId}
                >
                  <span>
                    {storeId
                      ? (stores.find((s) => s.id === storeId)?.name ??
                        tCommon("unknown"))
                      : tDevices("tokens.storePlaceholder")}
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
              <Label>{tDevices("passive.storeLabel")}</Label>
              <Input value={admin?.storeName ?? tCommon("unknown")} disabled />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="passive-name">
              {tDevices("passive.nameLabel")}
            </Label>
            <Input
              id="passive-name"
              value={assignedName}
              onChange={(e) => setAssignedName(e.target.value)}
              maxLength={100}
              aria-invalid={!!errors.assignedName}
            />
            {errors.assignedName && (
              <InlineError message={errors.assignedName} className="mt-1" />
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-2">
              <Label>{tDevices("passive.bitsLabel")}</Label>
              <Badge variant="outline" className="border-border">
                16
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {tDevices("passive.bitsHelp")}
          </p>

          <div className="space-y-2">
            <Label htmlFor="passive-hex">{tDevices("passive.hexLabel")}</Label>
            <Input
              id="passive-hex"
              value={rfCodeHex}
              onChange={(e) => setRfCodeHex(e.target.value)}
              onBlur={() => setRfCodeHex(rfCodeHex.toUpperCase())}
              maxLength={4}
              className="font-mono"
              placeholder="0A1B"
              aria-invalid={!!errors.rfCodeHex}
            />
            <p className="text-xs text-muted-foreground">
              {tDevices("passive.hexHelp")}
            </p>
            {errors.rfCodeHex && (
              <InlineError message={errors.rfCodeHex} className="mt-1" />
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={loading}
            >
              {loading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tDevices("passive.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
