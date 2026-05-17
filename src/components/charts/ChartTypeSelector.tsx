import type { ChartType } from "@/lib/charts/chartTypes";
import { CHART_TYPE_LABELS } from "@/lib/charts/chartTypes";
import { tabActive, tabInactive } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";

type ChartTypeSelectorProps = {
  value: ChartType;
  options: ChartType[];
  onChange: (type: ChartType) => void;
  className?: string;
};

export function ChartTypeSelector({ value, options, onChange, className }: ChartTypeSelectorProps) {
  if (options.length <= 1) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group" aria-label="Chart type">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Chart
      </span>
      {options.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "rounded-lg px-2 py-1 text-[10px] font-medium transition",
            value === type ? tabActive : tabInactive,
          )}
          aria-pressed={value === type}
        >
          {CHART_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
