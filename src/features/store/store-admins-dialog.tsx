"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StoreDto } from "@/types/store";
import { StoreAdminsContent } from "./store-admins-content";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-5 p-4 s:px-5 s:py-6">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {store
              ? tStores("adminsDialogTitle", { storeName: store.name })
              : ""}
          </DialogTitle>
        </DialogHeader>
        <StoreAdminsContent
          store={store}
          active={open}
          onAdminRemoved={onAdminRemoved}
          variant="dialog"
        />
      </DialogContent>
    </Dialog>
  );
}
