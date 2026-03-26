"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getOverviewRealtime,
  getRealtimeStats,
} from "@/features/analytics/api";
import type {
  OverviewRealtimeResponse,
  RealtimeStatsResponse,
} from "@/features/analytics/types";
import { POLLING_INTERVAL } from "@/lib/constants";
import "@/styles/analytics.css";

interface RealtimeStatsProps {
  storeId?: string | null;
  isSuperAdmin: boolean;
}

export function RealtimeStats({ storeId, isSuperAdmin }: RealtimeStatsProps) {
  const t = useTranslations("analytics.realtime");
  const tCommon = useTranslations("common");
  const [storeStats, setStoreStats] = useState<RealtimeStatsResponse | null>(
    null,
  );
  const [overviewStats, setOverviewStats] =
    useState<OverviewRealtimeResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchStats = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const res = await getOverviewRealtime();
        setOverviewStats(res);
      } else if (storeId) {
        const res = await getRealtimeStats(storeId);
        setStoreStats(res);
      }
    } catch {
      // Silently fail on polling errors
    }
  }, [storeId, isSuperAdmin]);

  useEffect(() => {
    void fetchStats();
    intervalRef.current = setInterval(fetchStats, POLLING_INTERVAL);

    function handleVisibility() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (!document.hidden) {
        void fetchStats();
        intervalRef.current = setInterval(fetchStats, POLLING_INTERVAL);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchStats]);

  const fallback = tCommon("loading");

  if (isSuperAdmin) {
    return (
      <div className="analytics-stats-grid">
        <StatCard
          label={t("activeStores")}
          value={overviewStats?.activeStores}
          fallback={fallback}
        />
        <StatCard
          label={t("issuedToday")}
          value={overviewStats?.totalIssuedToday}
          fallback={fallback}
        />
        <StatCard
          label={t("totalServing")}
          value={overviewStats?.totalServingCount}
          fallback={fallback}
        />
        <StatCard
          label={t("avgWait")}
          value={
            overviewStats?.estimatedAvgWaitMinutes != null
              ? `~${Math.round(overviewStats.estimatedAvgWaitMinutes)} min`
              : null
          }
          fallback={fallback}
          isText
        />
      </div>
    );
  }

  return (
    <div className="analytics-stats-grid">
      <StatCard
        label={t("queueNow")}
        value={storeStats?.currentQueueSize}
        fallback={fallback}
      />
      <StatCard
        label={t("servingNow")}
        value={storeStats?.currentServingCount}
        fallback={fallback}
      />
      <StatCard
        label={t("issuedToday")}
        value={storeStats?.ticketsIssuedToday}
        fallback={fallback}
      />
      <StatCard
        label={t("avgWait")}
        value={
          storeStats?.estimatedAvgWaitMinutes != null
            ? `~${Math.round(storeStats.estimatedAvgWaitMinutes)} min`
            : null
        }
        fallback={fallback}
        isText
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  fallback,
  isText = false,
}: {
  label: string;
  value: number | string | null | undefined;
  fallback: string;
  isText?: boolean;
}) {
  return (
    <div className="analytics-stat-card glass-card rounded-xl">
      <span className="analytics-stat-value text-foreground">
        {value != null ? (isText ? value : value.toLocaleString()) : fallback}
      </span>
      <span className="analytics-stat-label">{label}</span>
    </div>
  );
}
