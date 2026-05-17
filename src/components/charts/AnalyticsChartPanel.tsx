import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import {
  allowedChartTypes,
  defaultChartType,
  type ChartKind,
  type ChartType,
} from "@/lib/charts/chartTypes";
import type { ChartDateRange } from "@/lib/analytics/dateRange";
import { useMemo, useState } from "react";
import { AnalyticsChart } from "./AnalyticsChart";
import { ChartDateFilter } from "./ChartDateFilter";
import { ChartColorLegend } from "./ChartColorLegend";
import { ChartTypeSelector } from "./ChartTypeSelector";

type AnalyticsChartPanelProps = {
  title: string;
  description?: string;
  data: ChartDatum[];
  chartKind: ChartKind;
  categoryAxisLabel: string;
  valueAxisLabel: string;
  valueLabel?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  dateRange?: ChartDateRange;
  onDateRangeChange?: (range: ChartDateRange) => void;
  dateHint?: string;
  initialChartType?: ChartType;
  showLegend?: boolean;
};

export function AnalyticsChartPanel({
  title,
  description,
  data,
  chartKind,
  categoryAxisLabel,
  valueAxisLabel,
  valueLabel = "count",
  isEmpty = false,
  emptyMessage = "No data for this period.",
  className = "",
  dateRange,
  onDateRangeChange,
  dateHint,
  initialChartType,
  showLegend = true,
}: AnalyticsChartPanelProps) {
  const typeOptions = useMemo(() => allowedChartTypes(chartKind), [chartKind]);
  const [chartType, setChartType] = useState<ChartType>(
    () => initialChartType ?? defaultChartType(chartKind),
  );

  const axisSummary =
    chartType === "pie"
      ? `Categories on slices · values = ${valueLabel}`
      : chartType === "horizontalBar"
        ? `Y-axis: ${categoryAxisLabel} · X-axis: ${valueAxisLabel}`
        : `X-axis: ${categoryAxisLabel} · Y-axis: ${valueAxisLabel}`;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      <p className="mt-1 text-[10px] font-medium text-teal-700 dark:text-teal-400">{axisSummary}</p>

      <div className="mt-3 flex flex-col gap-2">
        {dateRange && onDateRangeChange ? (
          <ChartDateFilter value={dateRange} onChange={onDateRangeChange} compact />
        ) : null}
        <ChartTypeSelector value={chartType} options={typeOptions} onChange={setChartType} />
        {dateHint ? <p className="text-[10px] text-slate-500 dark:text-slate-400">{dateHint}</p> : null}
      </div>

      <div className="mt-4 min-h-[14rem] w-full">
        {isEmpty ? (
          <p className="flex h-56 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            {emptyMessage}
          </p>
        ) : (
          <>
            <div className="h-56 w-full">
              <AnalyticsChart
                type={chartType}
                data={data}
                valueLabel={valueLabel}
                categoryAxisLabel={categoryAxisLabel}
                valueAxisLabel={valueAxisLabel}
              />
            </div>
            {showLegend && chartType !== "pie" && data.length > 0 ? (
              <ChartColorLegend data={data} valueLabel={valueLabel} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
