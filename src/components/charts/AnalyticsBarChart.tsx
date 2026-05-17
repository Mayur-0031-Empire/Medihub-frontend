import { useChartTheme } from "@/hooks/useChartTheme";
import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import { CHART_COLORS } from "@/lib/analytics/appointmentAnalytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsBarChartProps = {
  data: ChartDatum[];
  valueLabel?: string;
  categoryAxisLabel?: string;
  valueAxisLabel?: string;
  layout?: "horizontal" | "vertical";
};

export function AnalyticsBarChart({
  data,
  valueLabel = "Count",
  categoryAxisLabel = "Category",
  valueAxisLabel = "Count",
  layout = "vertical",
}: AnalyticsBarChartProps) {
  const theme = useChartTheme();
  const horizontal = layout === "horizontal";
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{
          top: 20,
          right: 12,
          left: horizontal ? 12 : 8,
          bottom: horizontal ? 8 : 40,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={!horizontal} horizontal />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: theme.tick }} allowDecimals={false} domain={[0, maxValue || 1]}>
              <Label value={valueAxisLabel} offset={0} position="insideBottom" style={{ fontSize: 11, fill: theme.label }} />
            </XAxis>
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 10, fill: theme.tick }}
            >
              <Label
                value={categoryAxisLabel}
                angle={-90}
                position="insideLeft"
                style={{ fontSize: 11, fill: theme.label, textAnchor: "middle" }}
              />
            </YAxis>
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: theme.tick }}
              interval={0}
              angle={data.length > 3 ? -22 : 0}
              textAnchor={data.length > 3 ? "end" : "middle"}
              height={data.length > 3 ? 56 : 32}
            >
              <Label value={categoryAxisLabel} offset={0} position="insideBottom" dy={20} style={{ fontSize: 11, fill: theme.label }} />
            </XAxis>
            <YAxis
              tick={{ fontSize: 11, fill: theme.tick }}
              allowDecimals={false}
              width={40}
              domain={[0, maxValue || 1]}
            >
              <Label
                value={valueAxisLabel}
                angle={-90}
                position="insideLeft"
                style={{ fontSize: 11, fill: theme.label, textAnchor: "middle" }}
              />
            </YAxis>
          </>
        )}
        <Tooltip
          cursor={{ fill: theme.cursor }}
          labelFormatter={(label) => `${categoryAxisLabel}: ${label}`}
          formatter={(value: number) => [`${value} ${valueLabel}`, valueAxisLabel]}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${theme.tooltipBorder}`,
            background: theme.tooltipBg,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
          <LabelList dataKey="value" position={horizontal ? "right" : "top"} fontSize={11} fill={theme.label} />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill ?? CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
