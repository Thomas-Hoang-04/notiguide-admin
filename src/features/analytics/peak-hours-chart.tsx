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
import type { PeakHoursResponse } from "./types";

interface PeakHoursChartProps {
  data: PeakHoursResponse | null;
  loading: boolean;
}

function formatHourTick(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatHourRange(hour: number): string {
  const next = (hour + 1) % 24;
  return `${formatHourTick(hour)} – ${formatHourTick(next)}`;
}

export function PeakHoursChart({ data, loading }: PeakHoursChartProps) {
  const t = useTranslations("analytics.charts");
  const tAnalytics = useTranslations("analytics");

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-4 l:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground l:mb-4">
        {t("peakHours")}
      </h3>
      {loading ? (
        <Skeleton className="h-56 w-full rounded l:h-64" />
      ) : !data ? (
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
              data={data.hours}
              margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
              />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHourTick}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                interval={3}
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
                labelFormatter={(h) => formatHourRange(Number(h))}
              />
              <Bar
                dataKey="avgTickets"
                name={t("issued")}
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
