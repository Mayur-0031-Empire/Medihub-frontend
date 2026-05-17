import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import type { ChartDateRange } from "@/lib/analytics/dateRange";
import type { ReactNode } from "react";
import { ChartColorLegend } from "./ChartColorLegend";
import { ChartDateFilter } from "./ChartDateFilter";

type ChartPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  legendData?: ChartDatum[];
  legendValueLabel?: string;
  dateRange?: ChartDateRange;
  onDateRangeChange?: (range: ChartDateRange) => void;
  dateHint?: string;
};

export function ChartPanel({
  title,
  description,
  children,
  className = "",
  emptyMessage = "No data yet.",
  isEmpty = false,
  legendData,
  legendValueLabel,
  dateRange,
  onDateRangeChange,
  dateHint,
}: ChartPanelProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      {dateRange && onDateRangeChange ? (
        <div className="mt-3">
          <ChartDateFilter value={dateRange} onChange={onDateRangeChange} compact />
          {dateHint ? <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{dateHint}</p> : null}
        </div>
      ) : null}
      <div className="mt-4 min-h-[14rem] w-full">
        {isEmpty ? (
          <p className="flex h-56 items-center justify-center text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        ) : (
          <>
            <div className="h-56 w-full">{children}</div>
            {legendData && legendData.length > 0 ? (
              <ChartColorLegend data={legendData} valueLabel={legendValueLabel} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
