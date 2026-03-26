export interface RealtimeStatsResponse {
  currentQueueSize: number;
  currentServingCount: number;
  ticketsIssuedToday: number;
  estimatedAvgWaitMinutes: number | null;
}

export interface StoreSummaryResponse {
  period: string;
  totalIssued: number;
  totalCompleted: number;
  totalCancelled: number;
  totalSkipped: number;
  avgWaitSeconds: number | null;
  avgServiceSeconds: number | null;
  medianWaitSeconds: number | null;
  peakHour: number | null;
  cancelRate: number | null;
  skipRate: number | null;
}

export interface PeakHoursResponse {
  range: string;
  hours: HourlyCount[];
}

export interface HourlyCount {
  hour: number;
  avgTickets: number;
}

export interface DailyThroughputResponse {
  range: string;
  days: DailyCount[];
}

export interface DailyCount {
  date: string;
  issued: number;
  completed: number;
  cancelled: number;
  skipped: number;
}

export interface OverviewRealtimeResponse {
  activeStores: number;
  totalQueueSize: number;
  totalServingCount: number;
  totalIssuedToday: number;
  estimatedAvgWaitMinutes: number | null;
}

export interface OverviewResponse {
  period: string;
  totalStores: number;
  totalIssued: number;
  totalCompleted: number;
  avgWaitSeconds: number | null;
  stores: StoreAnalyticsSummary[];
}

export interface StoreAnalyticsSummary {
  storeId: string;
  storeName: string;
  issued: number;
  completed: number;
  cancelled: number;
  skipped: number;
  avgWaitSeconds: number | null;
}

export interface WaitDistributionResponse {
  period: string;
  buckets: WaitBucket[];
}

export interface WaitBucket {
  label: string;
  minMinutes: number;
  maxMinutes: number | null;
  count: number;
}

export interface HourlyHeatmapResponse {
  range: string;
  cells: HeatmapCell[];
}

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  avgTickets: number;
}

export type AnalyticsPeriod = "TODAY" | "WEEK" | "MONTH" | "QUARTER";
export type AnalyticsRange = "D7" | "D30" | "D90";

/** Custom date range (ISO date strings, e.g. "2026-03-01") */
export interface DateRange {
  from: string;
  to: string;
}

/** Either a preset period or a custom date range */
export type PeriodOrRange = AnalyticsPeriod | DateRange;

export function isDateRange(v: PeriodOrRange): v is DateRange {
  return typeof v === "object" && "from" in v && "to" in v;
}
