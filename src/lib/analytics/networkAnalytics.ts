import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import { CHART_COLORS } from "@/lib/analytics/appointmentAnalytics";
import type { PublicDoctorProfile } from "@/types/appointment";

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toChartData(map: Map<string, number>, limit = 10): ChartDatum[] {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

function truncateLabel(label: string, max = 36): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

/** Verified doctors grouped by the hospital where they practice. */
export function doctorsPerHospital(doctors: PublicDoctorProfile[]): ChartDatum[] {
  const map = new Map<string, number>();
  for (const d of doctors) {
    const hospital = d.hospitalName?.trim() || "Hospital not listed";
    bump(map, hospital);
  }
  return toChartData(map, 12).map((d) => ({ ...d, name: truncateLabel(d.name, 28) }));
}

/**
 * Specialty / care area at each hospital (from doctor profiles).
 * Shown as "Hospital — Specialty" so disease-type care maps to a facility.
 */
export function specialtiesByHospital(doctors: PublicDoctorProfile[]): ChartDatum[] {
  const map = new Map<string, number>();
  for (const d of doctors) {
    const hospital = d.hospitalName?.trim() || "Hospital not listed";
    const specialty = d.specialization?.trim() || "General practice";
    bump(map, `${hospital} — ${specialty}`);
  }
  return toChartData(map, 10).map((d) => ({ ...d, name: truncateLabel(d.name, 40) }));
}

/** Network-wide specialty distribution (all hospitals combined). */
export function specialtiesNetworkWide(doctors: PublicDoctorProfile[]): ChartDatum[] {
  const map = new Map<string, number>();
  for (const d of doctors) {
    const specialty = d.specialization?.trim() || "General practice";
    bump(map, specialty);
  }
  return toChartData(map, 8).map((d) => ({ ...d, name: truncateLabel(d.name, 32) }));
}
