"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { StoreAnalyticsSummary } from "./types";

interface StoreRankingTableProps {
  stores: StoreAnalyticsSummary[];
  loading: boolean;
}

type SortKey = "issued" | "wait" | "cancel";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatPercent(cancelled: number, issued: number): string {
  if (issued === 0) return "—";
  return `${((cancelled / issued) * 100).toFixed(1)}%`;
}

export function StoreRankingTable({ stores, loading }: StoreRankingTableProps) {
  const t = useTranslations("analytics.storeRanking");
  const tCharts = useTranslations("analytics.charts");
  const tSummary = useTranslations("analytics.summary");
  const tAnalytics = useTranslations("analytics");

  const [sortKey, setSortKey] = useState<SortKey>("issued");

  const sortLabels: Record<SortKey, string> = {
    issued: t("sortIssued"),
    wait: t("sortWait"),
    cancel: t("sortCancel"),
  };

  const sorted = useMemo(() => {
    const copy = [...stores];
    switch (sortKey) {
      case "issued":
        return copy.sort((a, b) => b.issued - a.issued);
      case "wait":
        return copy.sort(
          (a, b) => (b.avgWaitSeconds ?? 0) - (a.avgWaitSeconds ?? 0),
        );
      case "cancel":
        return copy.sort((a, b) => {
          const rateA = a.issued > 0 ? a.cancelled / a.issued : 0;
          const rateB = b.issued > 0 ? b.cancelled / b.issued : 0;
          return rateB - rateA;
        });
    }
  }, [stores, sortKey]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 l:p-5">
        <div className="mb-3 flex items-center justify-between gap-2 l:mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-32 rounded" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          {Array.from({ length: 3 }, (_, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders never reorder
            <Skeleton key={idx} className="h-8 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 l:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 l:mb-4">
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        {stores.length > 0 && (
          <Select
            value={sortKey}
            onValueChange={(v) => v && setSortKey(v as SortKey)}
          >
            <SelectTrigger className="h-7 w-auto min-w-32 gap-1.5 px-2.5 text-xs">
              <span className="truncate">{sortLabels[sortKey]}</span>
            </SelectTrigger>
            <SelectContent align="end" className="p-1">
              <SelectItem value="issued" className="text-xs">
                {sortLabels.issued}
              </SelectItem>
              <SelectItem value="wait" className="text-xs">
                {sortLabels.wait}
              </SelectItem>
              <SelectItem value="cancel" className="text-xs">
                {sortLabels.cancel}
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tAnalytics("noData")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t("storeName")}</th>
                <th className="pb-2 pr-4 font-medium text-right">
                  {tCharts("issued")}
                </th>
                <th className="pb-2 pr-4 font-medium text-right">
                  {tCharts("completed")}
                </th>
                <th className="pb-2 pr-4 font-medium text-right">
                  {tSummary("totalCancelled")}
                </th>
                <th className="pb-2 pr-4 font-medium text-right">
                  {tSummary("avgQueueWait")}
                </th>
                <th className="pb-2 pr-4 font-medium text-right">
                  {tSummary("cancelRate")}
                </th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((store) => (
                <tr
                  key={store.storeId}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="py-2.5 pr-4 font-medium">{store.storeName}</td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    {store.issued.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    {store.completed.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    {store.cancelled.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    {formatDuration(store.avgWaitSeconds)}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    {formatPercent(store.cancelled, store.issued)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/dashboard/analytics/${store.storeId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
