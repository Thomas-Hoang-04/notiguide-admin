"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AnalyticsPeriod } from "./types";

interface PeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}

const PERIODS: AnalyticsPeriod[] = ["TODAY", "WEEK", "MONTH", "QUARTER"];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const t = useTranslations("analytics.period");

  const labels: Record<AnalyticsPeriod, string> = {
    TODAY: t("today"),
    WEEK: t("week"),
    MONTH: t("month"),
    QUARTER: t("quarter"),
  };

  return (
    <div className="glass-panel flex flex-wrap gap-1 rounded-xl p-1.5">
      {PERIODS.map((p) => (
        <Button
          key={p}
          variant={value === p ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(p)}
          className={value === p ? "" : "text-muted-foreground"}
        >
          {labels[p]}
        </Button>
      ))}
    </div>
  );
}
