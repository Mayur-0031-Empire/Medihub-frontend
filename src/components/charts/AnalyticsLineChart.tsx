import { useChartTheme } from "@/hooks/useChartTheme";
import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import { CHART_COLORS } from "@/lib/analytics/appointmentAnalytics";
import {
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsLineChartProps = {
  data: ChartDatum[];
  valueLabel?: string;
  categoryAxisLabel?: string;
  valueAxisLabel?: string;
};

export function AnalyticsLineChart({
  data,
  valueLabel = "Count",
  categoryAxisLabel = "Category",
  valueAxisLabel = "Count",
}: AnalyticsLineChartProps) {
  const theme = useChartTheme();
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const angled = data.length > 4;

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 16, left: 8, bottom: angled ? 48 : 32 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: theme.tick }}
          interval={0}
          angle={angled ? -28 : 0}
          textAnchor={angled ? "end" : "middle"}
          height={angled ? 56 : 36}
        >
          <Label
            value={categoryAxisLabel}
            offset={0}
            position="insideBottom"
            dy={angled ? 16 : 8}
            style={{ fontSize: 11, fill: theme.label }}
          />
        </XAxis>
        <YAxis
          tick={{ fontSize: 11, fill: theme.tick }}
          allowDecimals={false}
          width={44}
          domain={[0, maxValue || 1]}
        >
          <Label
            value={valueAxisLabel}
            angle={-90}
            position="insideLeft"
            style={{ fontSize: 11, fill: theme.label, textAnchor: "middle" }}
          />
        </YAxis>
        <Tooltip
          labelFormatter={(label) => `${categoryAxisLabel}: ${label}`}
          formatter={(value: number) => [`${value} ${valueLabel}`, valueAxisLabel]}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${theme.tooltipBorder}`,
            background: theme.tooltipBg,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS[0]}
          strokeWidth={2.5}
          dot={{ r: 4, fill: CHART_COLORS[0], strokeWidth: 2, stroke: theme.tooltipBg }}
          activeDot={{ r: 6 }}
        >
          <LabelList dataKey="value" position="top" fontSize={10} fill={theme.label} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}
