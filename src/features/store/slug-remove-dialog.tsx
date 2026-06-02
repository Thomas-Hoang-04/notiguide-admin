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
import { removeSlug } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { StoreSlugDto } from "@/types/store";

interface SlugRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: StoreSlugDto | null;
  storeId: string;
  onSuccess: () => void;
}

export function SlugRemoveDialog({
  open,
  onOpenChange,
  slug,
  storeId,
  onSuccess,
}: SlugRemoveDialogProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!slug) return;
    setLoading(true);
    try {
      await removeSlug(storeId, slug.slug);
      toast.success(tStores("slugRemoved"));
      onOpenChange(false);
      void onSuccess();
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
          <AlertDialogTitle>{tStores("removeSlugTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tStores("removeSlugConfirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleRemove();
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
