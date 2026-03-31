"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HourlyHeatmapResponse } from "./types";

interface HourlyHeatmapProps {
  data: HourlyHeatmapResponse | null;
  loading: boolean;
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const LABEL_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export function HourlyHeatmap({ data, loading }: HourlyHeatmapProps) {
  const t = useTranslations("analytics.heatmap");
  const tAnalytics = useTranslations("analytics");

  const { cellMap, maxTickets } = useMemo(() => {
    if (!data) return { cellMap: new Map<string, number>(), maxTickets: 0 };
    const map = new Map<string, number>();
    let max = 0;
    for (const cell of data.cells) {
      const key = `${cell.dayOfWeek}-${cell.hour}`;
      map.set(key, cell.avgTickets);
      if (cell.avgTickets > max) max = cell.avgTickets;
    }
    return { cellMap: map, maxTickets: max };
  }, [data]);

  const hasData = maxTickets > 0;

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-4 l:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground l:mb-4">
        {t("title")}
      </h3>
      {loading || !hasData ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tAnalytics("noData")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour headers */}
            <div className="mb-4 flex">
              <div className="w-10 shrink-0" />
              <div className="grid flex-1 grid-cols-24">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="text-center text-[10px] text-muted-foreground"
                  >
                    {LABEL_HOURS.includes(h) ? formatHour(h) : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Day rows */}
            <TooltipProvider>
              {DAY_KEYS.map((dayKey, di) => {
                const dow = di + 1;
                return (
                  <div key={dayKey} className="mb-0.5 flex items-center">
                    <div className="w-10 shrink-0 pr-2.5 mr-4 text-right text-[11px] font-medium text-muted-foreground">
                      {t(dayKey)}
                    </div>
                    <div className="grid flex-1 grid-cols-24 gap-px">
                      {HOURS.map((h) => {
                        const value = cellMap.get(`${dow}-${h}`) ?? 0;
                        const opacity = maxTickets > 0 ? value / maxTickets : 0;
                        return (
                          <Tooltip key={h}>
                            <TooltipTrigger
                              render={<div />}
                              className="aspect-5/3 rounded-[2px]"
                              style={{
                                backgroundColor: `color-mix(in srgb, var(--chart-accent) ${Math.round(opacity * 100)}%, transparent)`,
                              }}
                            />
                            <TooltipContent
                              side="top"
                              sideOffset={4}
                              className="*:last:hidden"
                            >
                              {t("tooltip", {
                                day: t(dayKey),
                                hourRange: `${formatHour(h)}–${formatHour((h + 1) % 24)}`,
                                value: value.toFixed(1),
                              })}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TooltipProvider>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2.5 text-xs text-muted-foreground">
              <span>0</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 1].map((o) => (
                  <div
                    key={o}
                    className="h-3.5 w-5 rounded-sm"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--chart-accent) ${Math.round(o * 100)}%, transparent)`,
                    }}
                  />
                ))}
              </div>
              <span>{maxTickets.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
