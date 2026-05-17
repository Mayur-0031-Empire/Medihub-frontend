import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import type { ChartType } from "@/lib/charts/chartTypes";
import { AnalyticsBarChart } from "./AnalyticsBarChart";
import { AnalyticsLineChart } from "./AnalyticsLineChart";
import { AnalyticsPieChart } from "./AnalyticsPieChart";

type AnalyticsChartProps = {
  type: ChartType;
  data: ChartDatum[];
  valueLabel?: string;
  categoryAxisLabel?: string;
  valueAxisLabel?: string;
};

export function AnalyticsChart({
  type,
  data,
  valueLabel = "Count",
  categoryAxisLabel = "Category",
  valueAxisLabel = "Count",
}: AnalyticsChartProps) {
  if (type === "pie") {
    return <AnalyticsPieChart data={data} valueLabel={valueLabel} categoryAxisLabel={categoryAxisLabel} />;
  }

  if (type === "line") {
    return (
      <AnalyticsLineChart
        data={data}
        valueLabel={valueLabel}
        categoryAxisLabel={categoryAxisLabel}
        valueAxisLabel={valueAxisLabel}
      />
    );
  }

  return (
    <AnalyticsBarChart
      data={data}
      layout={type === "horizontalBar" ? "horizontal" : "vertical"}
      valueLabel={valueLabel}
      categoryAxisLabel={categoryAxisLabel}
      valueAxisLabel={valueAxisLabel}
    />
  );
}
