import { useChartTheme } from "@/hooks/useChartTheme";
import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import { CHART_COLORS } from "@/lib/analytics/appointmentAnalytics";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type AnalyticsPieChartProps = {
  data: ChartDatum[];
  valueLabel?: string;
  categoryAxisLabel?: string;
};

export function AnalyticsPieChart({
  data,
  valueLabel = "Patients",
  categoryAxisLabel = "Category",
}: AnalyticsPieChartProps) {
  const theme = useChartTheme();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={44}
          outerRadius={68}
          paddingAngle={2}
          label={({ name, percent }) => (percent >= 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : "")}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`slice-${index}`} fill={entry.fill ?? CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, _name, item) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return [`${value} ${valueLabel} (${pct}%)`, `${categoryAxisLabel}: ${String(item.payload?.name ?? "")}`];
          }}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${theme.tooltipBorder}`,
            background: theme.tooltipBg,
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={48}
          iconType="square"
          iconSize={10}
          formatter={(value) => <span className="text-xs text-slate-700 dark:text-slate-300">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
