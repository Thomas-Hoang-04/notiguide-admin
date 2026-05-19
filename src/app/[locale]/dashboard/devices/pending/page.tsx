"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { listDevices } from "@/features/device/api";
import { DeviceTabNav } from "@/features/device/device-tab-nav";
import { PendingReviewCard } from "@/features/device/pending-review-card";
import { Link } from "@/i18n/navigation";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";

export default function DevicesPendingPage() {
  const { isSuperAdmin, storeId: adminStoreId } = useAuthStore();
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const [devices, setDevices] = useState<DeviceDto[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const filterStore = isSuperAdmin ? null : adminStoreId;
      const result = await listDevices(null, filterStore);
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
  }, [isSuperAdmin, adminStoreId, tErrors]);

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  const pendingDevices =
    devices?.filter(
      (d) => d.status === "PENDING" || d.status === "PENDING_RF_CODE",
    ) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/devices"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </Link>
        <h1 className="text-2xl font-bold">{tDevices("pendingTab")}</h1>
      </div>

      <DeviceTabNav active="pending" />

      {!loading && pendingDevices && pendingDevices.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          {tDevices("pendingEmpty")}
        </div>
      ) : (
        <PendingReviewCard
          devices={devices}
          loading={loading}
          onActionComplete={() => void fetchDevices()}
        />
      )}
    </div>
  );
}
