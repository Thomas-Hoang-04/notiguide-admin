"use client";

import { addMonths, format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { DateRange as RDPDateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AnalyticsPeriod, PeriodOrRange } from "./types";
import { isDateRange } from "./types";

interface DateRangePickerProps {
  value: PeriodOrRange;
  onChange: (value: PeriodOrRange) => void;
}

const PRESETS: AnalyticsPeriod[] = ["TODAY", "WEEK", "MONTH", "QUARTER"];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const t = useTranslations("analytics.period");
  const tCommon = useTranslations("analytics.dateRange");
  const [open, setOpen] = useState(false);
  const selectedRange = isDateRange(value) ? value : null;
  const selectedRangeFrom = selectedRange?.from;
  const selectedRangeTo = selectedRange?.to;

  // Draft state tracks in-progress range selection inside the calendar.
  const [draft, setDraft] = useState<RDPDateRange | undefined>(undefined);
  // Controls which month the left panel shows
  const [month, setMonth] = useState<Date>(() => addMonths(new Date(), -1));

  // Reset draft and displayed month when popover opens
  useEffect(() => {
    if (!open) {
      return;
    }

    if (selectedRangeFrom && selectedRangeTo) {
      const to = new Date(selectedRangeTo);
      setDraft({ from: new Date(selectedRangeFrom), to });
      // Show `to`'s month on the right panel → left panel is one month before
      setMonth(addMonths(to, -1));
      return;
    }

    setDraft(undefined);
    // Default: current month on the right → left is previous month
    setMonth(addMonths(new Date(), -1));
  }, [open, selectedRangeFrom, selectedRangeTo]);

  const presetLabels: Record<AnalyticsPeriod, string> = {
    TODAY: t("today"),
    WEEK: t("week"),
    MONTH: t("month"),
    QUARTER: t("quarter"),
  };

  const isCustom = selectedRange !== null;

  function handleCalendarSelect(range: RDPDateRange | undefined) {
    setDraft(range);

    // Only commit when both ends are selected (min={1} ensures
    // first click only sets `from`, second click completes the range)
    if (range?.from && range?.to) {
      onChange({
        from: format(range.from, "yyyy-MM-dd"),
        to: format(range.to, "yyyy-MM-dd"),
      });
      setOpen(false);
    }
  }

  function handlePreset(preset: AnalyticsPeriod) {
    onChange(preset);
  }

  const customLabel = isCustom
    ? `${format(new Date(selectedRange.from), "dd/MM")} – ${format(new Date(selectedRange.to), "dd/MM")}`
    : tCommon("custom");

  return (
    <div className="glass-panel flex flex-wrap items-center gap-1 rounded-xl p-1.5">
      {PRESETS.map((p) => (
        <Button
          key={p}
          variant={!isCustom && value === p ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePreset(p)}
          className={!isCustom && value === p ? "" : "text-muted-foreground"}
        >
          {presetLabels[p]}
        </Button>
      ))}

      <div className="flex items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
              isCustom
                ? "bg-primary text-primary-foreground rounded-r-none"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <CalendarIcon className="size-3.5" />
            {customLabel}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            <Calendar
              mode="range"
              min={1}
              selected={draft}
              onSelect={handleCalendarSelect}
              month={month}
              onMonthChange={setMonth}
              endMonth={new Date()}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              classNames={{
                months: "relative flex flex-row gap-4",
              }}
            />
          </PopoverContent>
        </Popover>
        {isCustom && (
          <button
            type="button"
            aria-label={tCommon("clear")}
            onClick={() => onChange("TODAY")}
            className="inline-flex h-8 items-center rounded-r-md bg-primary px-1.5 text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <XIcon aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
