"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listServiceTypes, updateServiceType } from "@/features/store/api";
import { DeleteServiceTypeDialog } from "@/features/store/delete-service-type-dialog";
import { ServiceTypeFormDialog } from "@/features/store/service-type-form-dialog";
import { ServiceTypesTable } from "@/features/store/service-types-table";
import { StoreQueueSettingsContent } from "@/features/store/store-queue-settings-content";
import { useStoreQueueSettings } from "@/features/store/use-store-queue-settings";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { ApiError } from "@/types/api";
import type { ServiceTypeDto, StoreDto } from "@/types/store";

interface StoreQueueSettingsSectionProps {
  store: StoreDto;
  onStoreUpdated: (store: StoreDto) => void;
}

export function StoreQueueSettingsSection({
  store,
  onStoreUpdated,
}: StoreQueueSettingsSectionProps) {
  const tStores = useTranslations("stores");
  const tErrors = useTranslations("errors");

  // Service type CRUD state
  const [stItems, setStItems] = useState<ServiceTypeDto[]>([]);
  const [stLoading, setStLoading] = useState(true);
  const [stFormOpen, setStFormOpen] = useState(false);
  const [stEditTarget, setStEditTarget] = useState<ServiceTypeDto | null>(null);
  const [stDeleteOpen, setStDeleteOpen] = useState(false);
  const [stDeleteTarget, setStDeleteTarget] = useState<ServiceTypeDto | null>(
    null,
  );
  const {
    alertThreshold,
    allowJumpCall,
    allowNoShow,
    fetching,
    gracePeriodSec,
    handleSaveLimits,
    handleSaveNoShow,
    handleToggle,
    maxQueueSize,
    maxRequeues,
    noShowAction,
    requeueOffset,
    savingLimits,
    savingNoShow,
    setAlertThreshold,
    setGracePeriodSec,
    setMaxQueueSize,
    setMaxRequeues,
    setNoShowAction,
    setRequeueOffset,
    toggleLoading,
  } = useStoreQueueSettings({
    initialStore: store,
    onStoreUpdated,
    storeId: store.id,
  });

  const fetchServiceTypes = useCallback(async () => {
    setStLoading(true);
    try {
      const types = await listServiceTypes(store.id);
      setStItems(types);
    } catch {
      // ignore
    } finally {
      setStLoading(false);
    }
  }, [store.id]);

  useEffect(() => {
    void fetchServiceTypes();
  }, [fetchServiceTypes]);

  if (fetching) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service Types */}
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>{tStores("serviceTypes")}</CardTitle>
          </div>
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setStEditTarget(null);
                setStFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" />
              {tStores("addServiceType")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ServiceTypesTable
            items={stItems}
            loading={stLoading}
            onCreate={() => {
              setStEditTarget(null);
              setStFormOpen(true);
            }}
            onEdit={(st) => {
              setStEditTarget(st);
              setStFormOpen(true);
            }}
            onDelete={(st) => {
              setStDeleteTarget(st);
              setStDeleteOpen(true);
            }}
            onToggleActive={(st) => {
              void (async () => {
                try {
                  const updated = await updateServiceType(store.id, st.id, {
                    isActive: !st.isActive,
                  });
                  setStItems((prev) =>
                    prev.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  );
                  toast.success(tStores("serviceTypeUpdated"));
                } catch (err) {
                  const apiErr = err as ApiError;
                  toast.error(
                    apiErr?.code
                      ? translateCommonApiError(apiErr, tErrors)
                      : translateNetworkError(tErrors),
                  );
                }
              })();
            }}
          />
        </CardContent>
      </Card>

      <StoreQueueSettingsContent
        alertThreshold={alertThreshold}
        allowJumpCall={allowJumpCall}
        allowNoShow={allowNoShow}
        gracePeriodId={`qs-gracePeriodSec-${store.id}`}
        gracePeriodSec={gracePeriodSec}
        handleSaveLimits={handleSaveLimits}
        handleSaveNoShow={handleSaveNoShow}
        handleToggle={handleToggle}
        ids={{
          alertThreshold: `qs-alertThreshold-${store.id}`,
          maxQueueSize: `qs-maxQueueSize-${store.id}`,
          maxRequeues: `qs-maxRequeues-${store.id}`,
          requeueOffset: `qs-requeueOffset-${store.id}`,
        }}
        maxQueueSize={maxQueueSize}
        maxRequeues={maxRequeues}
        noShowAction={noShowAction}
        requeueOffset={requeueOffset}
        savingLimits={savingLimits}
        savingNoShow={savingNoShow}
        setAlertThreshold={setAlertThreshold}
        setGracePeriodSec={setGracePeriodSec}
        setMaxQueueSize={setMaxQueueSize}
        setMaxRequeues={setMaxRequeues}
        setNoShowAction={setNoShowAction}
        setRequeueOffset={setRequeueOffset}
        toggleLoading={toggleLoading}
      />

      <ServiceTypeFormDialog
        open={stFormOpen}
        onOpenChange={setStFormOpen}
        serviceType={stEditTarget}
        storeId={store.id}
        onSuccess={() => void fetchServiceTypes()}
      />
      <DeleteServiceTypeDialog
        open={stDeleteOpen}
        onOpenChange={setStDeleteOpen}
        serviceType={stDeleteTarget}
        storeId={store.id}
        onSuccess={() => void fetchServiceTypes()}
      />
    </div>
  );
}
