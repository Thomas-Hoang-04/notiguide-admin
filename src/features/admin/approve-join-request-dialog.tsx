"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { JoinRequestDto } from "@/types/admin";
import type { StoreDto } from "@/types/store";

interface ApproveJoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: JoinRequestDto | null;
  requireStore: boolean;
  stores: StoreDto[];
  onConfirm: (storeId?: string) => Promise<void>;
}

export function ApproveJoinRequestDialog({
  open,
  onOpenChange,
  request,
  requireStore,
  stores,
  onConfirm,
}: ApproveJoinRequestDialogProps) {
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset the store selection each time the dialog opens for a fresh request.
  // A failed approve keeps the dialog open (open stays true), so the admin's
  // selection is preserved for retry; only a new open resets it.
  useEffect(() => {
    if (open) setStoreId("");
  }, [open]);

  async function confirm() {
    if (requireStore && !storeId) return;
    setLoading(true);
    try {
      await onConfirm(requireStore ? storeId : undefined);
      onOpenChange(false);
      setStoreId("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !loading && onOpenChange(next)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tAdmins("requestApproveTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{request?.username}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          {requireStore && (
            <div className="space-y-2">
              <Label>{tAdmins("requestApproveStoreLabel")}</Label>
              <Select value={storeId} onValueChange={(v) => v && setStoreId(v)}>
                <SelectTrigger className="h-10 w-full gap-2 px-3">
                  <span>
                    {storeId
                      ? stores.find((s) => s.id === storeId)?.name
                      : tAdmins("storePlaceholder")}
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
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading || (requireStore && !storeId)}
            onClick={(e) => {
              e.preventDefault();
              void confirm();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {loading && (
              <Loader2
                aria-hidden="true"
                className="mr-2 size-4 animate-spin"
              />
            )}
            {tAdmins("requestApprove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
