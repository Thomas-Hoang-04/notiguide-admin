"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StoreAnalyticsSummary } from "./types";

interface StoreComparisonChartProps {
  stores: StoreAnalyticsSummary[];
  loading: boolean;
}

export function StoreComparisonChart({
  stores,
  loading,
}: StoreComparisonChartProps) {
  const t = useTranslations("analytics.storeComparison");
  const tAnalytics = useTranslations("analytics");

  const chartData = useMemo(() => {
    return stores
      .filter((s) => s.issued > 0)
      .map((s) => ({
        name: s.storeName,
        cancelRate: Number(((s.cancelled / s.issued) * 100).toFixed(1)),
        skipRate: Number(((s.skipped / s.issued) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.cancelRate + b.skipRate - (a.cancelRate + a.skipRate))
      .slice(0, 10);
  }, [stores]);

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-4 l:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground l:mb-4">
        {t("title")}
      </h3>
      {loading || chartData.length === 0 ? (
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
                unit="%"
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
                formatter={(value: number) => `${value}%`}
              />
              <Legend
                wrapperStyle={{ fontSize: "0.75rem" }}
                iconType="square"
              />
              <Bar
                dataKey="cancelRate"
                name={t("cancelRate")}
                fill="var(--destructive)"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
              <Bar
                dataKey="skipRate"
                name={t("skipRate")}
                fill="var(--warning)"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
