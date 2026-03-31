"use client";

import { Loader2, UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { listAdmins, updateAdminStore } from "@/features/admin/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { getVerificationTranslationKey } from "@/lib/i18n-keys";
import type { AdminDto } from "@/types/admin";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";

interface StoreAdminsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreDto | null;
  onAdminRemoved: () => void;
}

export function StoreAdminsDialog({
  open,
  onOpenChange,
  store,
  onAdminRemoved,
}: StoreAdminsDialogProps) {
  const tStores = useTranslations("stores");
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const [admins, setAdmins] = useState<AdminDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminDto | null>(null);

  const fetchAdmins = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const result = await listAdmins(0, 100, store.id);
      setAdmins(result.items);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }, [store, tErrors]);

  useEffect(() => {
    if (open && store) {
      void fetchAdmins();
    }
    if (!open) {
      setAdmins([]);
      setConfirmTarget(null);
    }
  }, [open, store, fetchAdmins]);

  async function handleUnassign() {
    if (!confirmTarget) return;
    setActionLoading(confirmTarget.id);
    try {
      await updateAdminStore(confirmTarget.id, null);
      toast.success(
        tStores("adminUnassignedToast", { username: confirmTarget.username }),
      );
      setConfirmTarget(null);
      setAdmins((prev) => prev.filter((a) => a.id !== confirmTarget.id));
      onAdminRemoved();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl gap-5 p-4 s:px-5 s:py-6">
          <DialogHeader className="pr-8">
            <DialogTitle>
              {store
                ? tStores("adminsDialogTitle", { storeName: store.name })
                : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-1 max-h-96 space-y-3 overflow-y-auto pr-1">
            {loading &&
              ["a", "b", "c"].map((id) => (
                <div
                  key={`skeleton-${id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3.5"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="size-8 rounded-md" />
                </div>
              ))}

            {!loading && admins.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {tStores("adminsDialogEmpty")}
              </p>
            )}

            {!loading &&
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3.5"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate text-sm font-medium">
                      {admin.username}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        admin.isVerified
                          ? "mt-1 border-success/30 bg-success/10 text-success text-xs"
                          : "mt-1 border-warning/40 bg-warning/15 text-warning text-xs dark:border-warning/50 dark:bg-warning/20"
                      }
                    >
                      {tAdmins(getVerificationTranslationKey(admin.isVerified))}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmTarget(admin)}
                          disabled={actionLoading === admin.id}
                          className="shrink-0 text-destructive hover:text-destructive"
                        />
                      }
                    >
                      {actionLoading === admin.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserMinus className="size-4" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      {tStores("unassignAdminTooltip")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(v) => {
          if (!v) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent className="gap-5 p-5 s:px-5 s:py-6">
          <AlertDialogHeader className="gap-2.5">
            <AlertDialogTitle>{tStores("unassignAdminTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget
                ? tStores("unassignAdminConfirmation", {
                    username: confirmTarget.username,
                    storeName: store?.name ?? "",
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 -mx-6 -mb-6 p-6 s:-mx-7 s:-mb-7 s:px-7 s:py-5">
            <AlertDialogCancel disabled={!!actionLoading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleUnassign();
              }}
              disabled={!!actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {tStores("unassignAdminButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
