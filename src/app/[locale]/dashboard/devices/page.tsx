"use client";

import { Plus, Radio, Usb } from "lucide-react";
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
import { DeviceTabNav } from "@/features/device/device-tab-nav";
import { EnrollmentTokenDialog } from "@/features/device/enrollment-token-dialog";
import { HubCapBadge } from "@/features/device/hub-cap-badge";
import { PassiveDeviceFormDialog } from "@/features/device/passive-device-form-dialog";
import { PendingReviewCard } from "@/features/device/pending-review-card";
import { UsbProvisionDialog } from "@/features/device/usb-provision-dialog";
import { getAvailableDevices } from "@/features/queue/api";
import { listStores } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { hasWebSerialSupport } from "@/lib/serial/support";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";
import type { StoreDto } from "@/types/store";

interface HubCapInfo {
  registered: number;
  max: number;
}

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
  const [usbDialogOpen, setUsbDialogOpen] = useState(false);
  const [canUseSerial, setCanUseSerial] = useState(false);

  const [hubCaps, setHubCaps] = useState<Map<string, HubCapInfo>>(new Map());

  useEffect(() => {
    setCanUseSerial(hasWebSerialSupport());
  }, []);

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

  useEffect(() => {
    const storeIds = isSuperAdmin
      ? stores.map((s) => s.id)
      : adminStoreId
        ? [adminStoreId]
        : [];
    if (storeIds.length === 0) return;

    const promises = storeIds.map(async (sid) => {
      try {
        const [devRes, availRes] = await Promise.all([
          listDevices("TRANSMITTER_HUB", sid),
          getAvailableDevices(sid),
        ]);
        const registered = devRes.registered ?? 0;
        const max = availRes.maxHubsPerStore ?? 3;
        return [sid, { registered, max }] as const;
      } catch {
        return [sid, { registered: 0, max: 3 }] as const;
      }
    });
    Promise.all(promises).then((entries) => {
      setHubCaps(new Map(entries.filter(([, info]) => info.registered > 0)));
    });
  }, [isSuperAdmin, stores, adminStoreId]);

  const filteredDevices = devices?.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return !(hardwareFilter !== "all" && d.hardwareModel !== hardwareFilter);
  });

  const hasNoStore = !isSuperAdmin && !adminStoreId;

  const adminStoreHubCap = adminStoreId ? hubCaps.get(adminStoreId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 s:flex-row s:items-center s:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{tDevices("title")}</h1>
          {!isSuperAdmin && adminStoreHubCap && (
            <HubCapBadge
              registered={adminStoreHubCap.registered}
              max={adminStoreHubCap.max}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {canUseSerial && (
            <Button variant="outline" onClick={() => setUsbDialogOpen(true)}>
              <Usb aria-hidden="true" className="mr-2 size-4" />
              {tDevices("usb.provision_title")}
            </Button>
          )}
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

      <DeviceTabNav active="all" />

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

      <PendingReviewCard
        devices={devices}
        loading={loading}
        onActionComplete={() => void fetchDevices()}
      />

      {isSuperAdmin && hubCaps.size > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {[...hubCaps.entries()].map(([sid, info]) => {
            const store = stores.find((s) => s.id === sid);
            return (
              <div key={sid} className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {store?.name ?? sid}:
                </span>
                <HubCapBadge registered={info.registered} max={info.max} />
              </div>
            );
          })}
        </div>
      )}

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

      {canUseSerial && (
        <UsbProvisionDialog
          open={usbDialogOpen}
          onOpenChange={setUsbDialogOpen}
          onSuccess={() => void fetchDevices()}
        />
      )}
    </div>
  );
}
