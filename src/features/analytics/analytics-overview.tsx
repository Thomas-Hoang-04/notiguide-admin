"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { getOverview } from "./api";
import { DateRangePicker } from "./date-range-picker";
import { OverviewThroughputChart } from "./overview-throughput-chart";
import { OverviewPeriodStats } from "./period-stats";
import { StoreComparisonChart } from "./store-comparison-chart";
import { StoreRankingTable } from "./store-ranking-table";
import { StoreWaitChart } from "./store-wait-chart";
import type { OverviewResponse, PeriodOrRange } from "./types";

export function AnalyticsOverview() {
  const t = useTranslations("analytics");

  const [period, setPeriod] = useState<PeriodOrRange>("TODAY");
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: PeriodOrRange) => {
    setLoading(true);
    try {
      const res = await getOverview(p);
      setOverview(res);
    } catch {
      // errors handled by api layer
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(period);
  }, [fetchData, period]);

  const handlePeriodChange = (p: PeriodOrRange) => {
    setPeriod(p);
  };

  return (
    <div className="space-y-4 l:space-y-6">
      <h1 className="text-xl font-bold l:text-2xl">{t("overview")}</h1>

      <DateRangePicker value={period} onChange={handlePeriodChange} />

      <OverviewPeriodStats data={overview} period={period} loading={loading} />

      <OverviewThroughputChart
        stores={overview?.stores ?? []}
        period={period}
      />

      <div className="grid gap-4 l:grid-cols-2 l:gap-6">
        <StoreComparisonChart stores={overview?.stores ?? []} loading={loading} />
        <StoreWaitChart stores={overview?.stores ?? []} loading={loading} />
      </div>

      <StoreRankingTable stores={overview?.stores ?? []} loading={loading} />
    </div>
  );
}
