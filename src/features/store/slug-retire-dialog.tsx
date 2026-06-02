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
import { retireSlug } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { StoreSlugDto } from "@/types/store";

interface SlugRetireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: StoreSlugDto | null;
  storeId: string;
  onSuccess: () => void;
}

export function SlugRetireDialog({
  open,
  onOpenChange,
  slug,
  storeId,
  onSuccess,
}: SlugRetireDialogProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");
  const [loading, setLoading] = useState(false);

  async function handleRetire() {
    if (!slug) return;
    setLoading(true);
    try {
      await retireSlug(storeId, slug.slug);
      toast.success(tStores("slugRetired"));
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.code === 409) {
        toast.error(tStores("slugGraceLimit", { max: 5 }));
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tStores("retireSlugTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tStores("retireSlugConfirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleRetire();
            }}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tStores("retireSlug")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
