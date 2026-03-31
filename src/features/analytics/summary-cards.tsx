"use client";

import { useTranslations } from "next-intl";
import type { StoreSummaryResponse } from "./types";

interface SummaryCardsProps {
  summary: StoreSummaryResponse | null;
  loading: boolean;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

function formatHour(hour: number | null): string {
  if (hour == null) return "—";
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:00 ${suffix}`;
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  const t = useTranslations("analytics.summary");
  const tAnalytics = useTranslations("analytics");

  if (loading) return null;

  if (!summary) {
    return (
      <div className="glass-card rounded-xl p-4 l:p-5">
        <p className="text-sm text-muted-foreground">{tAnalytics("noData")}</p>
      </div>
    );
  }

  const items = [
    { label: t("totalIssued"), value: summary.totalIssued.toLocaleString() },
    {
      label: t("totalCompleted"),
      value: summary.totalCompleted.toLocaleString(),
    },
    {
      label: t("totalCancelled"),
      value: summary.totalCancelled.toLocaleString(),
    },
    {
      label: t("avgQueueWait"),
      value: formatDuration(summary.avgWaitSeconds),
    },
    {
      label: t("avgServiceTime"),
      value: formatDuration(summary.avgServiceSeconds),
    },
    {
      label: t("medianWait"),
      value: formatDuration(summary.medianWaitSeconds),
    },
    { label: t("cancelRate"), value: formatPercent(summary.cancelRate) },
    { label: t("peakHour"), value: formatHour(summary.peakHour) },
  ];

  return (
    <div className="glass-card rounded-xl p-4 l:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground l:mb-4">
        {t("title")}
      </h3>
      <div className="grid grid-cols-2 gap-3 l:grid-cols-4 l:gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-semibold text-foreground font-mono">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
