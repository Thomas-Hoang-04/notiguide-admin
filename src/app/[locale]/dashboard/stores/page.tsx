"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { listStores } from "@/features/store/api";
import { DeleteStoreDialog } from "@/features/store/delete-store-dialog";
import { StoreAdminsDialog } from "@/features/store/store-admins-dialog";
import { StoreFormDialog } from "@/features/store/store-form-dialog";
import { StoreManagementErrorBanner } from "@/features/store/store-management-error-banner";
import { StoreManagementHeader } from "@/features/store/store-management-header";
import { StoreManagementPagination } from "@/features/store/store-management-pagination";
import { StoreManagementTable } from "@/features/store/store-management-table";
import { useRouter } from "@/i18n/navigation";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { StoreDto, StorePageResponse } from "@/types/store";

export default function StoresPage() {
  const { isSuperAdmin, isHydrated } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();
  const tErrors = useTranslations("errors");

  const [data, setData] = useState<StorePageResponse | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreDto | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreDto | null>(null);
  const [adminsOpen, setAdminsOpen] = useState(false);
  const [adminsTarget, setAdminsTarget] = useState<StoreDto | null>(null);

  const fetchStores = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await listStores(p);
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
    [tErrors],
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (!isSuperAdmin) {
      router.replace("/dashboard", { locale });
      return;
    }
    void fetchStores(page);
  }, [fetchStores, isHydrated, isSuperAdmin, locale, page, router]);

  if (!isSuperAdmin) return null;

  function openEdit(store: StoreDto) {
    setEditStore(store);
    setFormOpen(true);
  }

  function openCreate() {
    setEditStore(null);
    setFormOpen(true);
  }

  function openAdmins(store: StoreDto) {
    setAdminsTarget(store);
    setAdminsOpen(true);
  }

  function openDelete(store: StoreDto) {
    setDeleteTarget(store);
    setDeleteOpen(true);
  }

  return (
    <div>
      <StoreManagementHeader onCreate={openCreate} />

      {error && (
        <StoreManagementErrorBanner
          error={error}
          onRetry={() => void fetchStores(page)}
        />
      )}

      <StoreManagementTable
        data={data}
        loading={loading}
        onCreate={openCreate}
        onDelete={openDelete}
        onEdit={openEdit}
        onViewAdmins={openAdmins}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <StoreManagementPagination
          data={data}
          page={page}
          onNext={() => setPage((p) => p + 1)}
          onPrev={() => setPage((p) => p - 1)}
        />
      )}

      <StoreFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        store={editStore}
        onSuccess={() => void fetchStores(page)}
      />

      <StoreAdminsDialog
        open={adminsOpen}
        onOpenChange={setAdminsOpen}
        store={adminsTarget}
        onAdminRemoved={() => void fetchStores(page)}
      />

      <DeleteStoreDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        store={deleteTarget}
        onSuccess={() => void fetchStores(page)}
      />
    </div>
  );
}
