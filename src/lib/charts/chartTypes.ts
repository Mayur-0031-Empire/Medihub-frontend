/** Visual chart types available in analytics panels. */
export type ChartType = "bar" | "horizontalBar" | "line" | "pie";

/** Semantic chart purpose — drives smart defaults and allowed type switches. */
export type ChartKind = "categorical" | "timeSeries" | "distribution" | "ranking";

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Bar",
  horizontalBar: "Horizontal bar",
  line: "Line",
  pie: "Pie",
};

export function defaultChartType(kind: ChartKind): ChartType {
  switch (kind) {
    case "timeSeries":
      return "line";
    case "distribution":
      return "pie";
    case "ranking":
      return "horizontalBar";
    case "categorical":
    default:
      return "bar";
  }
}

export function allowedChartTypes(kind: ChartKind): ChartType[] {
  switch (kind) {
    case "timeSeries":
      return ["line", "bar"];
    case "distribution":
      return ["pie", "bar", "line"];
    case "ranking":
      return ["horizontalBar", "bar", "line"];
    case "categorical":
    default:
      return ["bar", "line", "pie"];
  }
}
