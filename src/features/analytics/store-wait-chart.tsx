"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { StoreAnalyticsSummary } from "./types";

interface StoreWaitChartProps {
  stores: StoreAnalyticsSummary[];
  loading: boolean;
}

export function StoreWaitChart({ stores, loading }: StoreWaitChartProps) {
  const t = useTranslations("analytics.storeWait");
  const tAnalytics = useTranslations("analytics");

  const chartData = useMemo(() => {
    return stores
      .flatMap((s) => {
        if (s.avgWaitSeconds == null) {
          return [];
        }

        return [
          {
            name: s.storeName,
            avgWait: Number((s.avgWaitSeconds / 60).toFixed(1)),
          },
        ];
      })
      .sort((a, b) => b.avgWait - a.avgWait)
      .slice(0, 10);
  }, [stores]);

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-4 l:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground l:mb-4">
        {t("title")}
      </h3>
      {loading ? (
        <Skeleton className="h-56 w-full rounded" />
      ) : chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tAnalytics("noData")}
        </p>
      ) : (
        <div
          className="min-w-0 font-mono"
          style={{ height: Math.max(224, chartData.length * 40 + 40) }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 1, height: 1 }}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                width={90}
              />
              <Tooltip
                cursor={{ fill: "var(--foreground)", opacity: 0.06 }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.8125rem",
                }}
                formatter={(value) =>
                  t("minutes", { value: String(value ?? 0) })
                }
              />
              <Bar
                dataKey="avgWait"
                name={t("avgWait")}
                fill="var(--chart-accent)"
                radius={[0, 4, 4, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
