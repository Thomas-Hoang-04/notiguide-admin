"use client";

import { useTranslations } from "next-intl";
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
import type { WaitDistributionResponse } from "./types";

interface WaitDistributionChartProps {
  data: WaitDistributionResponse | null;
  loading: boolean;
}

export function WaitDistributionChart({
  data,
  loading,
}: WaitDistributionChartProps) {
  const t = useTranslations("analytics.waitDistribution");
  const tAnalytics = useTranslations("analytics");

  const hasData = data?.buckets.some((b) => b.count > 0) ?? false;

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-4 l:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground l:mb-4">
        {t("title")}
      </h3>
      {loading ? (
        <Skeleton className="h-56 w-full rounded l:h-64" />
      ) : !hasData ? (
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
            <BarChart
              data={data?.buckets}
              margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `${v} ${t("minutes")}`}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                allowDecimals={false}
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
                labelFormatter={(label) => `${label} ${t("minutes")}`}
                formatter={(value) => [value ?? 0, t("tickets")]}
              />
              <Bar
                dataKey="count"
                name={t("tickets")}
                fill="var(--chart-accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
