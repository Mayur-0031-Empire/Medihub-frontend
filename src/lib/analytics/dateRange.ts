export type DateRangePreset = "today" | "yesterday" | "last7" | "last30" | "last90" | "custom";

export type ChartDateRange = {
  preset: DateRangePreset;
  from: Date;
  to: Date;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

export function chartDateRangeFromPreset(preset: DateRangePreset, ref = new Date()): ChartDateRange {
  const today = startOfDay(ref);
  switch (preset) {
    case "today":
      return { preset, from: today, to: endOfDay(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { preset, from: y, to: endOfDay(y) };
    }
    case "last7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { preset, from, to: endOfDay(today) };
    }
    case "last30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { preset, from, to: endOfDay(today) };
    }
    case "last90": {
      const from = new Date(today);
      from.setDate(from.getDate() - 89);
      return { preset, from, to: endOfDay(today) };
    }
    case "custom":
    default:
      return { preset: "last30", from: startOfDay(new Date(today.getTime() - 29 * 86400000)), to: endOfDay(today) };
  }
}

export function defaultChartDateRange(): ChartDateRange {
  return chartDateRangeFromPreset("last30");
}

export function formatChartDateRangeLabel(range: ChartDateRange): string {
  if (range.preset === "today") return "Today";
  if (range.preset === "yesterday") return "Yesterday";
  if (range.preset === "last7") return "Last 7 days";
  if (range.preset === "last30") return "Last 30 days";
  if (range.preset === "last90") return "Last 90 days";
  return `${range.from.toLocaleDateString()} – ${range.to.toLocaleDateString()}`;
}

export function appointmentInRange(iso: string | undefined, range: ChartDateRange): boolean {
  if (!iso) return false;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  return t.getTime() >= range.from.getTime() && t.getTime() <= range.to.getTime();
}

export function isSameLocalDayAsDate(iso: string | undefined, day: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  return startOfDay(t).getTime() === startOfDay(day).getTime();
}
