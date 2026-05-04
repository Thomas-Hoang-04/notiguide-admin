"use client";

import { Plus, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { listDevices } from "@/features/device/api";
import { DeviceFilterBar } from "@/features/device/device-filter-bar";
import { DeviceListTable } from "@/features/device/device-list-table";
import { EnrollmentTokenDialog } from "@/features/device/enrollment-token-dialog";
import { PassiveDeviceFormDialog } from "@/features/device/passive-device-form-dialog";
import { PendingReviewCard } from "@/features/device/pending-review-card";
import { listStores } from "@/features/store/api";
import { Link } from "@/i18n/navigation";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";
import type { StoreDto } from "@/types/store";

export default function DevicesPage() {
  const { isSuperAdmin, storeId: adminStoreId } = useAuthStore();
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const [devices, setDevices] = useState<DeviceDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreDto[]>([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [hardwareFilter, setHardwareFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");

  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [passiveDialogOpen, setPassiveDialogOpen] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const filterKind = kindFilter === "all" ? null : kindFilter;
      const filterStore = isSuperAdmin
        ? storeFilter === "all"
          ? null
          : storeFilter
        : adminStoreId;
      const result = await listDevices(filterKind, filterStore);
      setDevices(result.devices);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }, [kindFilter, storeFilter, isSuperAdmin, adminStoreId, tErrors]);

  useEffect(() => {
    void fetchDevices();
    if (isSuperAdmin) {
      listStores(0, 100)
        .then((res) => setStores(res.items))
        .catch(() => toast.error(tQueue("failedToLoadStores")));
    }
  }, [fetchDevices, isSuperAdmin, tQueue]);

  const filteredDevices = devices?.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return !(hardwareFilter !== "all" && d.hardwareModel !== hardwareFilter);
  });

  const hasNoStore = !isSuperAdmin && !adminStoreId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 s:flex-row s:items-center s:justify-between">
        <h1 className="text-2xl font-bold">{tDevices("title")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTokenDialogOpen(true)}>
            <Radio aria-hidden="true" className="mr-2 size-4" />
            {tDevices("tokens.issueAction")}
          </Button>
          {hasNoStore ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    disabled
                    aria-label={tDevices("passive.registerAction")}
                  >
                    <Plus aria-hidden="true" className="mr-2 size-4" />
                    {tDevices("passive.registerAction")}
                  </Button>
                }
              />
              <TooltipContent>
                {tDevices("passive.disabledNoStore")}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={() => setPassiveDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              <Plus aria-hidden="true" className="mr-2 size-4" />
              {tDevices("passive.registerAction")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard/devices/pending"
          className="text-primary hover:underline"
        >
          {tDevices("pendingTab")}
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href="/dashboard/devices/tokens"
          className="text-primary hover:underline"
        >
          {tDevices("tokensTab")}
        </Link>
      </div>

      <DeviceFilterBar
        statusFilter={statusFilter}
        kindFilter={kindFilter}
        hardwareFilter={hardwareFilter}
        storeFilter={storeFilter}
        stores={stores}
        isSuperAdmin={isSuperAdmin}
        onStatusChange={setStatusFilter}
        onKindChange={setKindFilter}
        onHardwareChange={setHardwareFilter}
        onStoreChange={setStoreFilter}
      />

      <PendingReviewCard devices={devices} loading={loading} />

      <DeviceListTable devices={filteredDevices ?? null} loading={loading} />

      <EnrollmentTokenDialog
        open={tokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
        onSuccess={() => void fetchDevices()}
      />

      <PassiveDeviceFormDialog
        open={passiveDialogOpen}
        onOpenChange={setPassiveDialogOpen}
        onSuccess={() => void fetchDevices()}
      />
    </div>
  );
}
