"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listServiceTypes, updateServiceType } from "@/features/store/api";
import { DeleteServiceTypeDialog } from "@/features/store/delete-service-type-dialog";
import { ServiceTypeFormDialog } from "@/features/store/service-type-form-dialog";
import { ServiceTypesTable } from "@/features/store/service-types-table";
import { StoreManagementErrorBanner } from "@/features/store/store-management-error-banner";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { ServiceTypeDto } from "@/types/store";

export default function ServiceTypesPage() {
  const { storeId } = useAuthStore();
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");

  const [items, setItems] = useState<ServiceTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceTypeDto | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceTypeDto | null>(null);

  const fetchServiceTypes = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listServiceTypes(storeId);
      setItems(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(translateCommonApiError(err, tErrors));
      } else {
        setError(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, tErrors]);

  useEffect(() => {
    void fetchServiceTypes();
  }, [fetchServiceTypes]);

  if (!storeId) return null;
  const currentStoreId = storeId;

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(st: ServiceTypeDto) {
    setEditTarget(st);
    setFormOpen(true);
  }

  function openDelete(st: ServiceTypeDto) {
    setDeleteTarget(st);
    setDeleteOpen(true);
  }

  async function handleToggleActive(st: ServiceTypeDto) {
    try {
      const updated = await updateServiceType(currentStoreId, st.id, {
        isActive: !st.isActive,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(tStores("serviceTypeUpdated"));
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{tStores("serviceTypes")}</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          {tStores("addServiceType")}
        </Button>
      </div>

      {error && (
        <StoreManagementErrorBanner
          error={error}
          onRetry={() => void fetchServiceTypes()}
        />
      )}

      <ServiceTypesTable
        items={items}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={openDelete}
        onToggleActive={(st) => void handleToggleActive(st)}
      />

      <ServiceTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        serviceType={editTarget}
        storeId={currentStoreId}
        onSuccess={() => void fetchServiceTypes()}
      />

      <DeleteServiceTypeDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        serviceType={deleteTarget}
        storeId={currentStoreId}
        onSuccess={() => void fetchServiceTypes()}
      />
    </div>
  );
}
