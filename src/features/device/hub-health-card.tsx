"use client";

import { AlertTriangle, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { HubHealthSummaryResponse } from "@/types/device";
import { getHubHealth } from "./api";

const HUB_HEALTH_POLL_INTERVAL = 15_000;

export function HubHealthCard() {
  const t = useTranslations("devices.hub.health");
  const [data, setData] = useState<HubHealthSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await getHubHealth();
      setData(res);
    } catch {
      // Silent — card stays hidden on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
    intervalRef.current = setInterval(fetchHealth, HUB_HEALTH_POLL_INTERVAL);

    function handleVisibility() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (!document.hidden) {
        void fetchHealth();
        intervalRef.current = setInterval(
          fetchHealth,
          HUB_HEALTH_POLL_INTERVAL,
        );
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 l:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-40" />
      </div>
    );
  }

  if (!data || data.totalHubs === 0) return null;

  return (
    <div className="glass-card rounded-xl p-4 l:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio aria-hidden="true" className="size-5 text-primary" />
          <h2 className="text-base font-semibold">{t("title")}</h2>
        </div>
        <Link
          href="/dashboard/devices"
          className="text-xs font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary/70"
        >
          {t("manageDevices")} →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-success/40 bg-success/10 text-success"
        >
          {t("online", { count: data.onlineHubs })}
        </Badge>
        <Badge
          variant="outline"
          className={
            data.offlineHubs > 0
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground"
          }
        >
          {t("offline", { count: data.offlineHubs })}
        </Badge>
      </div>

      {data.warnings.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          {data.warnings.map((w, i) => (
            <div
              key={`${w.deviceId}-${w.type}-${i}`}
              className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/15 px-3 py-1.5 text-xs text-warning dark:border-warning/50 dark:bg-warning/20"
            >
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="font-medium">{w.deviceName ?? w.deviceId}</span>
              <span className="text-warning-foreground">
                {warningLabel(t, w.type)} ({w.value})
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{t("allHealthy")}</p>
      )}
    </div>
  );
}

function warningLabel(
  t: ReturnType<typeof useTranslations>,
  type: string,
): string {
  switch (type) {
    case "LOW_MEMORY":
      return t("warningLowMemory");
    case "WEAK_SIGNAL":
      return t("warningWeakSignal");
    case "LONG_UPTIME":
      return t("warningLongUptime");
    default:
      return type;
  }
}
