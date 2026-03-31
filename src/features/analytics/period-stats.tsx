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

  return (
    <div className="analytics-stats-grid">
      <StatCard
        label={t("storesActive")}
        value={!loading && data ? data.totalStores : null}
        loading={loading}
        loadingText={tCommon("loading")}
      />
      <StatCard
        label={t("issued", { period: periodLabel })}
        value={!loading && data ? data.totalIssued : null}
        loading={loading}
        loadingText={tCommon("loading")}
      />
      <StatCard
        label={t("completed", { period: periodLabel })}
        value={!loading && data ? data.totalCompleted : null}
        loading={loading}
        loadingText={tCommon("loading")}
      />
      <StatCard
        label={t("avgWait")}
        value={!loading && data ? formatWait(data.avgWaitSeconds) : null}
        loading={loading}
        loadingText={tCommon("loading")}
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

  return (
    <div className="analytics-stats-grid">
      <StatCard
        label={t("issued", { period: periodLabel })}
        value={!loading && data ? data.totalIssued : null}
        loading={loading}
        loadingText={tCommon("loading")}
      />
      <StatCard
        label={t("completed", { period: periodLabel })}
        value={!loading && data ? data.totalCompleted : null}
        loading={loading}
        loadingText={tCommon("loading")}
      />
      <StatCard
        label={t("cancelled", { period: periodLabel })}
        value={!loading && data ? data.totalCancelled : null}
        loading={loading}
        loadingText={tCommon("loading")}
      />
      <StatCard
        label={t("avgWait")}
        value={!loading && data ? formatWait(data.avgWaitSeconds) : null}
        loading={loading}
        loadingText={tCommon("loading")}
        isText
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  loadingText,
  isText = false,
}: {
  label: string;
  value: number | string | null | undefined;
  loading: boolean;
  loadingText: string;
  isText?: boolean;
}) {
  const display = loading ? loadingText : value != null ? (isText ? value : value.toLocaleString()) : "—";
  return (
    <div className="analytics-stat-card glass-card rounded-xl">
      <span className="analytics-stat-value text-foreground">{display}</span>
      <span className="analytics-stat-label">{label}</span>
    </div>
  );
}
