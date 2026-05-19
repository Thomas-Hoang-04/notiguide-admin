import { get } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
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
import { type DateRange, isDateRange } from "./types";

function customQueryParams(range: DateRange): string {
  return `from=${range.from}&to=${range.to}`;
}

function periodParam(v: PeriodOrRange): string {
  if (isDateRange(v)) return customQueryParams(v);
  return `period=${v}`;
}

function rangeParam(v: PeriodOrRange): string {
  if (isDateRange(v)) return customQueryParams(v);
  switch (v) {
    case "TODAY":
    case "WEEK":
      return "range=D7";
    case "MONTH":
      return "range=D30";
    case "QUARTER":
      return "range=D90";
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
