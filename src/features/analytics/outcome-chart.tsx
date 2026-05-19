"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Skeleton } from "@/components/ui/skeleton";
import type { StoreSummaryResponse } from "./types";

interface OutcomeChartProps {
  summary: StoreSummaryResponse | null;
  loading: boolean;
}

const COLORS = [
  "var(--primary)",
  "var(--destructive)",
  "var(--warning)",
] as const;

export function OutcomeChart({ summary, loading }: OutcomeChartProps) {
  const t = useTranslations("analytics.outcome");
  const tAnalytics = useTranslations("analytics");

  const { chartData, total } = useMemo(() => {
    if (!summary) return { chartData: [], total: 0 };

    const segments = [
      { name: t("completed"), value: summary.totalCompleted, fill: COLORS[0] },
      { name: t("cancelled"), value: summary.totalCancelled, fill: COLORS[1] },
      { name: t("skipped"), value: summary.totalSkipped, fill: COLORS[2] },
    ];
    const sum = segments.reduce((acc, s) => acc + s.value, 0);
    return { chartData: segments, total: sum };
  }, [summary, t]);

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-4 l:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground l:mb-4">
        {t("title")}
      </h3>
      {loading ? (
        <Skeleton className="h-56 w-full rounded l:h-64" />
      ) : total === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tAnalytics("noData")}
        </p>
      ) : (
        <div className="flex h-56 min-w-0 flex-col font-mono l:h-64">
          <div className="relative min-h-0 flex-1">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 1, height: 1 }}
            >
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  dataKey="value"
                  stroke="none"
                />
                <Tooltip
                  offset={32}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "0.8125rem",
                  }}
                  formatter={(value: ValueType | undefined) => {
                    if (!value) return undefined;
                    const pct = (((value as number) / total) * 100).toFixed(1);
                    return `${value} (${pct}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground">{t("total")}</p>
              </div>
            </div>
          </div>
          {/* Legend below chart */}
          <div className="flex items-center justify-center gap-4 pt-2 text-xs">
            {chartData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
