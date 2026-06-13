"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { AdminDto } from "@/types/admin";

interface DeleteAdminDialogProps {
  loading: boolean;
  onConfirm: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  target: AdminDto | null;
}

export function DeleteAdminDialog({
  loading,
  onConfirm,
  onOpenChange,
  open,
  target,
}: DeleteAdminDialogProps) {
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tAdmins("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {target
              ? tAdmins("deleteConfirmation", { username: target.username })
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
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
