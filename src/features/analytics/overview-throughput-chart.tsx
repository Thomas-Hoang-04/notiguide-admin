"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getDailyThroughput, getOverviewThroughput } from "./api";
import type {
  DailyThroughputResponse,
  PeriodOrRange,
  StoreAnalyticsSummary,
} from "./types";

interface OverviewThroughputChartProps {
  stores: StoreAnalyticsSummary[];
  period: PeriodOrRange;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function OverviewThroughputChart({
  stores,
  period,
}: OverviewThroughputChartProps) {
  const t = useTranslations("analytics.storeThroughput");
  const tCharts = useTranslations("analytics.charts");
  const tAnalytics = useTranslations("analytics");

  const [selectedStore, setSelectedStore] = useState<string>("__all__");
  const [data, setData] = useState<DailyThroughputResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res =
        selectedStore === "__all__"
          ? await getOverviewThroughput(period)
          : await getDailyThroughput(selectedStore, period);
      setData(res);
    } catch {
      // handled by api layer
    } finally {
      setLoading(false);
    }
  }, [selectedStore, period]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const storeName =
    selectedStore === "__all__"
      ? t("allStores")
      : (stores.find((s) => s.storeId === selectedStore)?.storeName ?? "");

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-4 l:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 l:mb-4">
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <Select
          value={selectedStore}
          onValueChange={(v) => v && setSelectedStore(v)}
        >
          <SelectTrigger className="h-7 w-auto min-w-32 gap-1.5 px-2.5 text-xs">
            <span className="truncate">{storeName}</span>
          </SelectTrigger>
          <SelectContent
            align="end"
            alignItemWithTrigger={false}
            className="min-w-52 p-1"
          >
            <SelectItem value="__all__" className="text-xs">
              {t("allStores")}
            </SelectItem>
            {stores
              .filter((s) => s.issued > 0)
              .map((s) => (
                <SelectItem
                  key={s.storeId}
                  value={s.storeId}
                  className="text-xs"
                >
                  {s.storeName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-56 w-full rounded l:h-64" />
      ) : !data || data.days.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tAnalytics("noData")}
        </p>
      ) : (
        <div className="h-56 min-w-0 font-mono l:h-64">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 1, height: 1 }}
          >
            <LineChart
              data={data.days}
              margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.8125rem",
                }}
                labelFormatter={(d) => formatDate(String(d))}
              />
              <Legend
                wrapperStyle={{ fontSize: "0.75rem" }}
                iconType="plainline"
              />
              <Line
                type="monotone"
                dataKey="issued"
                name={tCharts("issued")}
                stroke="var(--chart-accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name={tCharts("completed")}
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
