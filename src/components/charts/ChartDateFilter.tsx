import {
  chartDateRangeFromPreset,
  formatChartDateRangeLabel,
  parseDateInputValue,
  toDateInputValue,
  type ChartDateRange,
  type DateRangePreset,
} from "@/lib/analytics/dateRange";
import { tabActive, tabInactive } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "7 days" },
  { id: "last30", label: "30 days" },
  { id: "last90", label: "90 days" },
  { id: "custom", label: "Custom" },
];

type ChartDateFilterProps = {
  value: ChartDateRange;
  onChange: (range: ChartDateRange) => void;
  className?: string;
  compact?: boolean;
};

export function ChartDateFilter({ value, onChange, className, compact = false }: ChartDateFilterProps) {
  function setPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      onChange({ ...value, preset: "custom" });
      return;
    }
    onChange(chartDateRangeFromPreset(preset));
  }

  function setCustomFrom(fromStr: string) {
    const from = parseDateInputValue(fromStr);
    if (!from) return;
    onChange({
      preset: "custom",
      from,
      to: value.to.getTime() >= from.getTime() ? value.to : from,
    });
  }

  function setCustomTo(toStr: string) {
    const toDate = parseDateInputValue(toStr);
    if (!toDate) return;
    const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
    onChange({
      preset: "custom",
      from: value.from.getTime() <= to.getTime() ? value.from : toDate,
      to,
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/50",
        compact ? "text-[10px]" : "text-xs",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {!compact ? <span>Period</span> : null}
        </span>
        {PRESETS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPreset(id)}
            className={cn(
              "rounded-lg px-2 py-1 font-medium transition",
              value.preset === id ? tabActive : tabInactive,
            )}
            aria-pressed={value.preset === id}
          >
            {label}
          </button>
        ))}
      </div>
      {value.preset === "custom" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            From
            <input
              type="date"
              value={toDateInputValue(value.from)}
              max={toDateInputValue(value.to)}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            To
            <input
              type="date"
              value={toDateInputValue(value.to)}
              min={toDateInputValue(value.from)}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        </div>
      ) : (
        <p className="mt-1.5 text-slate-500 dark:text-slate-400">{formatChartDateRangeLabel(value)}</p>
      )}
    </div>
  );
}
