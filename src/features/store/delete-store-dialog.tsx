"use client";

import { AlertCircle, Loader2 } from "lucide-react";
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
import type { StoreDto } from "@/types/store";
import { deleteStore } from "./api";

interface DeleteStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreDto | null;
  onSuccess: () => void;
}

export function DeleteStoreDialog({
  open,
  onOpenChange,
  store,
  onSuccess,
}: DeleteStoreDialogProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");
  const [loading, setLoading] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  async function handleDelete() {
    if (!store) return;
    setLoading(true);
    setConflictMessage(null);

    try {
      await deleteStore(store.id);
      toast.success(tStores("deletedToast", { storeName: store.name }));
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.code === 409) {
        if (err.message.includes("assigned admins")) {
          setConflictMessage(tStores("deleteConflictAdmins"));
        } else if (err.message.includes("active queue tickets")) {
          setConflictMessage(tStores("deleteConflictQueue"));
        } else {
          setConflictMessage(translateCommonApiError(err, tErrors));
        }
      } else if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setConflictMessage(null);
        onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tStores("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {store
              ? tStores("deleteConfirmation", { storeName: store.name })
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {conflictMessage && (
          <div className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{conflictMessage}</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tCommon("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
