"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineError } from "@/components/ui/inline-error";
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
import type { AdminDto } from "@/types/admin";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";
import { updateAdminStore } from "./api";

interface AssignStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminDto | null;
  onSuccess: () => void;
}

export function AssignStoreDialog({
  open,
  onOpenChange,
  admin,
  onSuccess,
}: AssignStoreDialogProps) {
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStoreId("");
      setError(null);
      listStores(0, 100)
        .then((res) => setStores(res.items))
        .catch(() => toast.error(tQueue("failedToLoadStores")));
    }
  }, [open, tQueue]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!admin || loading) return;

    if (!storeId) {
      setError(tAdmins("assignStoreRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateAdminStore(admin.id, storeId);
      const storeName =
        stores.find((s) => s.id === storeId)?.name ?? tCommon("unknown");
      toast.success(
        tAdmins("assignedToast", {
          username: admin.username,
          storeName,
        }),
      );
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {admin
              ? tAdmins("assignStoreTitle", { username: admin.username })
              : ""}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>{tAdmins("storeLabel")}</Label>
            <Select
              value={storeId}
              onValueChange={(v) => {
                if (v) {
                  setStoreId(v);
                  setError(null);
                }
              }}
            >
              <SelectTrigger
                className="h-10 w-full gap-2 px-3"
                aria-invalid={!!error}
              >
                <span>
                  {storeId
                    ? (stores.find((s) => s.id === storeId)?.name ??
                      tCommon("unknown"))
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
            {error && <InlineError message={error} className="mt-1" />}
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
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {tAdmins("assignStoreButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
