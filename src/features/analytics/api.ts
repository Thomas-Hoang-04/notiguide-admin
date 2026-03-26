import { get } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
  AnalyticsRange,
  DailyThroughputResponse,
  HourlyHeatmapResponse,
  OverviewRealtimeResponse,
  OverviewResponse,
  PeakHoursResponse,
  PeriodOrRange,
  RealtimeStatsResponse,
  StoreSummaryResponse,
  WaitDistributionResponse,
} from "./types";
import { isDateRange } from "./types";

function periodParam(v: PeriodOrRange): string {
  if (isDateRange(v)) return `CUSTOM&from=${v.from}&to=${v.to}`;
  return v;
}

function rangeParam(v: PeriodOrRange): AnalyticsRange {
  if (isDateRange(v)) {
    const days = Math.ceil(
      (new Date(v.to).getTime() - new Date(v.from).getTime()) / 86_400_000,
    );
    if (days <= 7) return "D7";
    if (days <= 30) return "D30";
    return "D90";
  }
  switch (v) {
    case "TODAY":
    case "WEEK":
      return "D7";
    case "MONTH":
      return "D30";
    case "QUARTER":
      return "D90";
  }
}

export function getRealtimeStats(storeId: string) {
  return get<RealtimeStatsResponse>(API_ROUTES.ANALYTICS.REALTIME(storeId));
}

export function getStoreSummary(storeId: string, period: PeriodOrRange) {
  return get<StoreSummaryResponse>(
    API_ROUTES.ANALYTICS.SUMMARY(storeId, periodParam(period)),
  );
}

export function getPeakHours(storeId: string, period: PeriodOrRange) {
  return get<PeakHoursResponse>(
    API_ROUTES.ANALYTICS.PEAK_HOURS(storeId, rangeParam(period)),
  );
}

export function getDailyThroughput(storeId: string, period: PeriodOrRange) {
  return get<DailyThroughputResponse>(
    API_ROUTES.ANALYTICS.THROUGHPUT(storeId, rangeParam(period)),
  );
}

export function getWaitDistribution(storeId: string, period: PeriodOrRange) {
  return get<WaitDistributionResponse>(
    API_ROUTES.ANALYTICS.WAIT_DISTRIBUTION(storeId, periodParam(period)),
  );
}

export function getHourlyHeatmap(storeId: string, period: PeriodOrRange) {
  return get<HourlyHeatmapResponse>(
    API_ROUTES.ANALYTICS.HEATMAP(storeId, rangeParam(period)),
  );
}

export function getOverviewRealtime() {
  return get<OverviewRealtimeResponse>(API_ROUTES.ANALYTICS.OVERVIEW_REALTIME);
}

export function getOverview(period: PeriodOrRange) {
  return get<OverviewResponse>(
    API_ROUTES.ANALYTICS.OVERVIEW(periodParam(period)),
  );
}

export function getOverviewThroughput(period: PeriodOrRange) {
  return get<DailyThroughputResponse>(
    API_ROUTES.ANALYTICS.OVERVIEW_THROUGHPUT(rangeParam(period)),
  );
}
