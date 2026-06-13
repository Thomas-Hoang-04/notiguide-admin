"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
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
import {
  isConfirmEnabled,
  isStoreRequired,
} from "@/features/admin/approve-join-request-logic";
import type { AdminRole, JoinRequestDto } from "@/types/admin";
import type { StoreDto } from "@/types/store";

interface ApproveJoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: JoinRequestDto | null;
  // True only for org-owner approvals (ORG-target requests): the approver may pick the
  // role, and a store is required only when ROLE_ADMIN is chosen.
  allowRoleChoice: boolean;
  stores: StoreDto[];
  onConfirm: (role: AdminRole, storeId?: string) => Promise<void>;
}

export function ApproveJoinRequestDialog({
  open,
  onOpenChange,
  request,
  allowRoleChoice,
  stores,
  onConfirm,
}: ApproveJoinRequestDialogProps) {
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const [role, setRole] = useState<AdminRole>("ROLE_ADMIN");
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset the selection each time the dialog opens for a fresh request. A failed approve
  // keeps the dialog open (open stays true), so the admin's selection is preserved for
  // retry; only a new open resets it.
  useEffect(() => {
    if (open) {
      setRole("ROLE_ADMIN");
      setStoreId("");
    }
  }, [open]);

  const storeRequired = isStoreRequired(allowRoleChoice, role);
  const confirmEnabled = isConfirmEnabled(allowRoleChoice, role, storeId);

  async function confirm() {
    if (!confirmEnabled) return;
    setLoading(true);
    try {
      await onConfirm(role, storeRequired ? storeId : undefined);
      onOpenChange(false);
      setRole("ROLE_ADMIN");
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
          {allowRoleChoice && (
            <div className="space-y-2">
              <Label>{tAdmins("roleLabel")}</Label>
              <Select
                value={role}
                onValueChange={(v) => v && setRole(v as AdminRole)}
              >
                <SelectTrigger className="h-10 w-full gap-2 px-3">
                  <span>
                    {role === "ROLE_SUPER_ADMIN"
                      ? tAdmins("roleSuperAdmin")
                      : tAdmins("roleAdmin")}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  className="p-1.5"
                >
                  <SelectItem value="ROLE_ADMIN" className="py-2">
                    {tAdmins("roleAdmin")}
                  </SelectItem>
                  <SelectItem value="ROLE_SUPER_ADMIN" className="py-2">
                    {tAdmins("roleSuperAdmin")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {storeRequired && (
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
          {role === "ROLE_SUPER_ADMIN" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/15 px-3.5 py-3 text-warning dark:border-warning/50 dark:bg-warning/20">
              <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
              <p className="text-sm">
                {tAdmins("requestApproveSuperAdminNote")}
              </p>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading || !confirmEnabled}
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
