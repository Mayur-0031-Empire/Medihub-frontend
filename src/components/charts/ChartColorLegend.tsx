import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import { CHART_COLORS } from "@/lib/analytics/appointmentAnalytics";

type ChartColorLegendProps = {
  data: ChartDatum[];
  valueLabel?: string;
};

/** Maps each chart color to its category name and count. */
export function ChartColorLegend({ data, valueLabel = "count" }: ChartColorLegendProps) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="mt-3 border-t border-slate-100 pt-3" aria-label="Chart legend">
      <p className="mb-2 text-xs font-medium text-slate-500">What each color means</p>
      <ul className="space-y-2">
        {data.map((item, index) => {
          const color = item.fill ?? CHART_COLORS[index % CHART_COLORS.length];
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <li key={item.name} className="flex items-start justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-start gap-2">
                <span
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-sm ring-1 ring-slate-200/80"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="text-slate-700">{item.name}</span>
              </span>
              <span className="shrink-0 text-right font-semibold tabular-nums text-slate-900">
                {item.value} {valueLabel}
                {total > 0 ? <span className="font-normal text-slate-500"> ({pct}%)</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
