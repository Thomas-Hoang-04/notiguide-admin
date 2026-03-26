"use client";

import { useTranslations } from "next-intl";
import type {
  OverviewResponse,
  PeriodOrRange,
  StoreSummaryResponse,
} from "./types";
import { isDateRange } from "./types";
import "@/styles/analytics.css";

interface OverviewPeriodStatsProps {
  data: OverviewResponse | null;
  period: PeriodOrRange;
  loading: boolean;
}

interface StorePeriodStatsProps {
  data: StoreSummaryResponse | null;
  period: PeriodOrRange;
  loading: boolean;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function usePeriodLabel(period: PeriodOrRange): string {
  const t = useTranslations("analytics.periodStats");
  if (isDateRange(period)) {
    return `${formatShortDate(period.from)} – ${formatShortDate(period.to)}`;
  }
  const map = {
    TODAY: t("today"),
    WEEK: t("thisWeek"),
    MONTH: t("thisMonth"),
    QUARTER: t("thisQuarter"),
  } as const;
  return map[period];
}

function formatWait(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.round(seconds / 60);
  return m > 0 ? `~${m} min` : `<1 min`;
}

export function OverviewPeriodStats({
  data,
  period,
  loading,
}: OverviewPeriodStatsProps) {
  const t = useTranslations("analytics.periodStats");
  const tCommon = useTranslations("common");
  const periodLabel = usePeriodLabel(period);
  const fallback = tCommon("loading");

  return (
    <div className="analytics-stats-grid">
      <StatCard
        label={t("storesActive")}
        value={!loading && data ? data.totalStores : null}
        fallback={fallback}
      />
      <StatCard
        label={t("issued", { period: periodLabel })}
        value={!loading && data ? data.totalIssued : null}
        fallback={fallback}
      />
      <StatCard
        label={t("completed", { period: periodLabel })}
        value={!loading && data ? data.totalCompleted : null}
        fallback={fallback}
      />
      <StatCard
        label={t("avgWait")}
        value={!loading && data ? formatWait(data.avgWaitSeconds) : null}
        fallback={fallback}
        isText
      />
    </div>
  );
}

export function StorePeriodStats({
  data,
  period,
  loading,
}: StorePeriodStatsProps) {
  const t = useTranslations("analytics.periodStats");
  const tCommon = useTranslations("common");
  const periodLabel = usePeriodLabel(period);
  const fallback = tCommon("loading");

  return (
    <div className="analytics-stats-grid">
      <StatCard
        label={t("issued", { period: periodLabel })}
        value={!loading && data ? data.totalIssued : null}
        fallback={fallback}
      />
      <StatCard
        label={t("completed", { period: periodLabel })}
        value={!loading && data ? data.totalCompleted : null}
        fallback={fallback}
      />
      <StatCard
        label={t("cancelled", { period: periodLabel })}
        value={!loading && data ? data.totalCancelled : null}
        fallback={fallback}
      />
      <StatCard
        label={t("avgWait")}
        value={!loading && data ? formatWait(data.avgWaitSeconds) : null}
        fallback={fallback}
        isText
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  fallback,
  isText = false,
}: {
  label: string;
  value: number | string | null | undefined;
  fallback: string;
  isText?: boolean;
}) {
  return (
    <div className="analytics-stat-card glass-card rounded-xl">
      <span className="analytics-stat-value text-foreground">
        {value != null ? (isText ? value : value.toLocaleString()) : fallback}
      </span>
      <span className="analytics-stat-label">{label}</span>
    </div>
  );
}
