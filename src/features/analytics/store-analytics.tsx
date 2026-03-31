"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useStoreName } from "@/features/queue/store-selector";
import {
  getDailyThroughput,
  getHourlyHeatmap,
  getPeakHours,
  getStoreSummary,
  getWaitDistribution,
} from "./api";
import { DateRangePicker } from "./date-range-picker";
import { HourlyHeatmap } from "./hourly-heatmap";
import { OutcomeChart } from "./outcome-chart";
import { PeakHoursChart } from "./peak-hours-chart";
import { StorePeriodStats } from "./period-stats";
import { SummaryCards } from "./summary-cards";
import { ThroughputChart } from "./throughput-chart";
import type {
  DailyThroughputResponse,
  HourlyHeatmapResponse,
  PeakHoursResponse,
  PeriodOrRange,
  StoreSummaryResponse,
  WaitDistributionResponse,
} from "./types";
import { WaitDistributionChart } from "./wait-distribution-chart";

interface StoreAnalyticsProps {
  storeId: string;
}

export function StoreAnalytics({ storeId }: StoreAnalyticsProps) {
  const t = useTranslations("analytics");
  const storeName = useStoreName(storeId);

  const [period, setPeriod] = useState<PeriodOrRange>("TODAY");
  const [summary, setSummary] = useState<StoreSummaryResponse | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursResponse | null>(null);
  const [throughput, setThroughput] = useState<DailyThroughputResponse | null>(
    null,
  );
  const [waitDist, setWaitDist] = useState<WaitDistributionResponse | null>(
    null,
  );
  const [heatmap, setHeatmap] = useState<HourlyHeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(
    async (p: PeriodOrRange) => {
      setLoading(true);
      try {
        const [summaryRes, peakRes, throughputRes, waitDistRes, heatmapRes] =
          await Promise.all([
            getStoreSummary(storeId, p),
            getPeakHours(storeId, p),
            getDailyThroughput(storeId, p),
            getWaitDistribution(storeId, p),
            getHourlyHeatmap(storeId, p),
          ]);
        setSummary(summaryRes);
        setPeakHours(peakRes);
        setThroughput(throughputRes);
        setWaitDist(waitDistRes);
        setHeatmap(heatmapRes);
      } catch {
        // errors handled by api layer toast
      } finally {
        setLoading(false);
      }
    },
    [storeId],
  );

  useEffect(() => {
    void fetchData(period);
  }, [fetchData, period]);

  const handlePeriodChange = (p: PeriodOrRange) => {
    setPeriod(p);
  };

  return (
    <div className="space-y-4 l:space-y-6">
      <h1 className="text-xl font-bold l:text-2xl">
        {storeName
          ? t("storeAnalyticsWithName", { storeName })
          : t("storeAnalytics")}
      </h1>

      <DateRangePicker value={period} onChange={handlePeriodChange} />

      <StorePeriodStats data={summary} period={period} loading={loading} />

      <SummaryCards summary={summary} loading={loading} />

      <div className="grid gap-4 l:grid-cols-2 l:gap-6">
        <OutcomeChart summary={summary} loading={loading} />
        <WaitDistributionChart data={waitDist} loading={loading} />
        <PeakHoursChart data={peakHours} loading={loading} />
        <ThroughputChart data={throughput} loading={loading} />
      </div>

      <HourlyHeatmap data={heatmap} loading={loading} />
    </div>
  );
}
