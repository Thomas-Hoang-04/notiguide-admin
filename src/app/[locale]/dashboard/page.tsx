"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  getDailyThroughput,
  getOverview,
  getPeakHours,
  getStoreSummary,
} from "@/features/analytics/api";
import { OutcomeChart } from "@/features/analytics/outcome-chart";
import { OverviewThroughputChart } from "@/features/analytics/overview-throughput-chart";
import { PeakHoursChart } from "@/features/analytics/peak-hours-chart";
import { RealtimeStats } from "@/features/analytics/realtime-stats";
import { StoreComparisonChart } from "@/features/analytics/store-comparison-chart";
import { StoreRankingTable } from "@/features/analytics/store-ranking-table";
import { StoreWaitChart } from "@/features/analytics/store-wait-chart";
import { ThroughputChart } from "@/features/analytics/throughput-chart";
import type {
  DailyThroughputResponse,
  OverviewResponse,
  PeakHoursResponse,
  StoreSummaryResponse,
} from "@/features/analytics/types";
import { useStoreName } from "@/features/queue/store-selector";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth";
import { useLayoutStore } from "@/store/layout";

export default function DashboardPage() {
  const tNav = useTranslations("navigation");
  const tAnalytics = useTranslations("analytics");
  const { isSuperAdmin, storeId } = useAuthStore();
  const { setPageGradientClass, clearPageGradientClass } = useLayoutStore();
  const storeName = useStoreName(storeId);

  useEffect(() => {
    setPageGradientClass("bg-gradient-page");
    return () => clearPageGradientClass();
  }, [setPageGradientClass, clearPageGradientClass]);

  if (isSuperAdmin) {
    return (
      <div className="space-y-4 l:space-y-6">
        <h1 className="text-xl font-bold l:text-2xl">{tNav("overview")}</h1>
        <RealtimeStats storeId={storeId} isSuperAdmin />
        <SuperAdminDashboardCharts />
        <Link
          href="/dashboard/analytics"
          className="inline-block text-sm text-primary hover:underline"
        >
          {tAnalytics("viewFullAnalytics")} →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 l:space-y-6">
      <h1 className="text-xl font-bold l:text-2xl">
        {storeName || tNav("overview")}
      </h1>
      <RealtimeStats storeId={storeId} isSuperAdmin={false} />
      {storeId && <AdminDashboardCharts storeId={storeId} />}
      <Link
        href="/dashboard/analytics"
        className="inline-block text-sm text-primary hover:underline"
      >
        {tAnalytics("viewFullAnalytics")} →
      </Link>
    </div>
  );
}

/** SuperAdmin: overview throughput chart + store ranking */
function SuperAdminDashboardCharts() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await getOverview("WEEK");
      setOverview(res);
    } catch {
      // handled by api layer
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <>
      <OverviewThroughputChart stores={overview?.stores ?? []} period="WEEK" />
      <div className="grid gap-4 l:grid-cols-2 l:gap-6">
        <StoreComparisonChart
          stores={overview?.stores ?? []}
          loading={loading}
        />
        <StoreWaitChart stores={overview?.stores ?? []} loading={loading} />
      </div>
      <StoreRankingTable stores={overview?.stores ?? []} loading={loading} />
    </>
  );
}

/** Regular Admin: throughput + outcome donut + peak hours for their store */
function AdminDashboardCharts({ storeId }: { storeId: string }) {
  const [throughput, setThroughput] = useState<DailyThroughputResponse | null>(
    null,
  );
  const [summary, setSummary] = useState<StoreSummaryResponse | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [throughputRes, summaryRes, peakRes] = await Promise.all([
        getDailyThroughput(storeId, "WEEK"),
        getStoreSummary(storeId, "WEEK"),
        getPeakHours(storeId, "WEEK"),
      ]);
      setThroughput(throughputRes);
      setSummary(summaryRes);
      setPeakHours(peakRes);
    } catch {
      // handled by api layer
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <>
      <ThroughputChart data={throughput} loading={loading} />
      <div className="grid gap-4 l:grid-cols-2 l:gap-6">
        <OutcomeChart summary={summary} loading={loading} />
        <PeakHoursChart data={peakHours} loading={loading} />
      </div>
    </>
  );
}
