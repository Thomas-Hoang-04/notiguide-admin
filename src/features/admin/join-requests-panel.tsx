"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approveJoinRequest,
  listJoinRequests,
  rejectJoinRequest,
} from "@/features/admin/api";
import { ApproveJoinRequestDialog } from "@/features/admin/approve-join-request-dialog";
import { RejectJoinRequestDialog } from "@/features/admin/reject-join-request-dialog";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { AdminRole, JoinRequestDto } from "@/types/admin";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";

interface JoinRequestsPanelProps {
  isSuperAdmin: boolean;
  stores: StoreDto[];
}

export function JoinRequestsPanel({
  isSuperAdmin,
  stores,
}: JoinRequestsPanelProps) {
  const tAdmins = useTranslations("admins");
  const tErrors = useTranslations("errors");
  const [requests, setRequests] = useState<JoinRequestDto[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<JoinRequestDto | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<JoinRequestDto | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setRequests(await listJoinRequests());
    } catch {
      // silent: panel is supplemental
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  async function doApprove(role: AdminRole, storeId?: string) {
    if (!approveTarget) return;
    try {
      await approveJoinRequest(approveTarget.requestId, role, storeId);
      toast.success(
        tAdmins("requestApprovedToast", { username: approveTarget.username }),
      );
      await fetchRequests();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? translateCommonApiError(err, tErrors)
          : translateNetworkError(tErrors),
      );
      // Re-throw so the dialog stays open on failure and the admin can retry.
      throw err;
    }
  }

  async function doReject() {
    if (!rejectTarget) return;
    setActionId(rejectTarget.requestId);
    try {
      await rejectJoinRequest(rejectTarget.requestId);
      toast.success(tAdmins("requestRejectedToast"));
      await fetchRequests();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? translateCommonApiError(err, tErrors)
          : translateNetworkError(tErrors),
      );
      // Re-throw so the reject dialog stays open on failure.
      throw err;
    } finally {
      setActionId(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{tAdmins("requestsTitle")}</h2>
      <div className="space-y-2.5">
        {requests.map((req) => (
          <div
            key={req.requestId}
            className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
          >
            <p className="truncate text-sm font-medium">{req.username}</p>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={actionId === req.requestId}
                onClick={() => setRejectTarget(req)}
              >
                {actionId === req.requestId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  tAdmins("requestReject")
                )}
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
                onClick={() => setApproveTarget(req)}
              >
                {tAdmins("requestApprove")}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <ApproveJoinRequestDialog
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        request={approveTarget}
        allowRoleChoice={isSuperAdmin}
        stores={stores}
        onConfirm={doApprove}
      />
      <RejectJoinRequestDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        request={rejectTarget}
        onConfirm={doReject}
      />
    </div>
  );
}
