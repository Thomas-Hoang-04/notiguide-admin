"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import type { JoinRequestDto } from "@/types/admin";

interface RejectJoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: JoinRequestDto | null;
  onConfirm: () => Promise<void>;
}

export function RejectJoinRequestDialog({
  open,
  onOpenChange,
  request,
  onConfirm,
}: RejectJoinRequestDialogProps) {
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
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
          <AlertDialogTitle>{tAdmins("requestRejectTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tAdmins("requestRejectConfirm", {
              username: request?.username ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void confirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && (
              <Loader2
                aria-hidden="true"
                className="mr-2 size-4 animate-spin"
              />
            )}
            {tAdmins("requestReject")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
