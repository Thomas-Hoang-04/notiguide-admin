"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminDirectoryErrorBanner } from "@/features/admin/admin-directory-error-banner";
import { AdminDirectoryPagination } from "@/features/admin/admin-directory-pagination";
import { AdminDirectoryTable } from "@/features/admin/admin-directory-table";
import { AdminDirectoryToolbar } from "@/features/admin/admin-directory-toolbar";
import { deleteAdmin, listAdmins, verifyAdmin } from "@/features/admin/api";
import { AssignStoreDialog } from "@/features/admin/assign-store-dialog";
import { CreateAdminDialog } from "@/features/admin/create-admin-dialog";
import { DeleteAdminDialog } from "@/features/admin/delete-admin-dialog";
import { JoinRequestsPanel } from "@/features/admin/join-requests-panel";
import {
  getOrgInviteLink,
  getStoreInviteLink,
  rotateOrgInviteLink,
  rotateStoreInviteLink,
} from "@/features/organization/api";
import { InviteLinkPanel } from "@/features/organization/invite-link-panel";
import { getStore, listStores } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import type { AdminDto, AdminPageResponse } from "@/types/admin";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";

export default function AdminsPage() {
  const { admin: currentAdmin, isSuperAdmin } = useAuthStore();
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const [data, setData] = useState<AdminPageResponse | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AdminDto | null>(null);

  const adminStoreId = currentAdmin?.storeId ?? null;
  const [storeOrgId, setStoreOrgId] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (isSuperAdmin || !adminStoreId) return;
    getStore(adminStoreId)
      .then((s) => setStoreOrgId(s.orgId))
      .catch(() => setStoreOrgId(undefined));
  }, [isSuperAdmin, adminStoreId]);

  const fetchAdmins = useCallback(
    async (p: number, storeId?: string | null, role?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const filterStoreId = isSuperAdmin
          ? storeId === "all"
            ? undefined
            : storeId
          : currentAdmin?.storeId;
        if (!isSuperAdmin && !filterStoreId) {
          setError(tAdmins("noStoreAssigned"));
          return;
        }
        const filterRole = role === "all" ? undefined : role;
        const result = await listAdmins(p, 20, filterStoreId, filterRole);
        setData(result);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(translateCommonApiError(err, tErrors));
        } else {
          setError(translateNetworkError(tErrors));
        }
      } finally {
        setLoading(false);
      }
    },
    [currentAdmin?.storeId, isSuperAdmin, tAdmins, tErrors],
  );

  useEffect(() => {
    void fetchAdmins(page, storeFilter, roleFilter);
    if (isSuperAdmin) {
      listStores(0, 100)
        .then((res) => setStores(res.items))
        .catch(() => toast.error(tQueue("failedToLoadStores")));
    }
  }, [fetchAdmins, isSuperAdmin, page, roleFilter, storeFilter, tQueue]);

  async function handleVerify(admin: AdminDto) {
    setActionLoading(admin.id);
    try {
      const updated = await verifyAdmin(admin.id);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((a) => (a.id === updated.id ? updated : a)),
        };
      });
      toast.success(tAdmins("verifiedToast", { username: admin.username }));
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAdmin(deleteTarget.id);
      toast.success(
        tAdmins("deletedToast", { username: deleteTarget.username }),
      );
      setDeleteOpen(false);
      await fetchAdmins(page, storeFilter, roleFilter);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  function getStoreName(sId: string | null): string {
    if (!sId) return tCommon("none");
    return stores.find((s) => s.id === sId)?.name || tCommon("unknown");
  }

  return (
    <div>
      {isSuperAdmin && (
        <div className="mb-6">
          <InviteLinkPanel
            fetchLink={getOrgInviteLink}
            generateLink={rotateOrgInviteLink}
          />
        </div>
      )}
      {!isSuperAdmin && adminStoreId && storeOrgId === null && (
        <div className="mb-6">
          <InviteLinkPanel
            fetchLink={() => getStoreInviteLink(adminStoreId)}
            generateLink={() => rotateStoreInviteLink(adminStoreId)}
          />
        </div>
      )}
      <JoinRequestsPanel isSuperAdmin={isSuperAdmin} stores={stores} />
      <AdminDirectoryToolbar
        isSuperAdmin={isSuperAdmin}
        roleFilter={roleFilter}
        storeFilter={storeFilter}
        stores={stores}
        onCreateAdmin={() => setCreateOpen(true)}
        onRoleFilterChange={(v) => {
          if (v) {
            setRoleFilter(v);
            setPage(0);
          }
        }}
        onStoreFilterChange={(v) => {
          if (v) {
            setStoreFilter(v);
            setPage(0);
          }
        }}
      />

      {error && (
        <AdminDirectoryErrorBanner
          error={error}
          onRetry={() => void fetchAdmins(page, storeFilter, roleFilter)}
        />
      )}

      <AdminDirectoryTable
        actionLoading={actionLoading}
        currentAdminId={currentAdmin?.id}
        data={data}
        isSuperAdmin={isSuperAdmin}
        loading={loading}
        onAssignStore={(admin) => {
          setAssignTarget(admin);
          setAssignOpen(true);
        }}
        onCreateAdmin={() => setCreateOpen(true)}
        onRequestDelete={(admin) => {
          setDeleteTarget(admin);
          setDeleteOpen(true);
        }}
        onVerify={(admin) => void handleVerify(admin)}
        resolveStoreName={getStoreName}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <AdminDirectoryPagination
          data={data}
          page={page}
          onNext={() => setPage((p) => p + 1)}
          onPrev={() => setPage((p) => p - 1)}
        />
      )}

      <AssignStoreDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        admin={assignTarget}
        onSuccess={() => void fetchAdmins(page, storeFilter, roleFilter)}
      />

      <CreateAdminDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => void fetchAdmins(page, storeFilter, roleFilter)}
      />

      <DeleteAdminDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        target={deleteTarget}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
