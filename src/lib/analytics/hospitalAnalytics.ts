import type { NearbyHospital } from "@/types/hospital";
import type { ChartDatum } from "./appointmentAnalytics";
import { CHART_COLORS } from "./appointmentAnalytics";

export function hospitalsByDistanceBucket(hospitals: NearbyHospital[]): ChartDatum[] {
  const withDistance = hospitals.filter((h) => h.distanceKm != null && Number.isFinite(h.distanceKm));
  if (withDistance.length === 0 && hospitals.length > 0) {
    return [{ name: "In your area", value: hospitals.length, fill: CHART_COLORS[0] }];
  }
  const buckets = [
    { name: "Under 0.5 km", max: 0.5 },
    { name: "0.5–1 km", max: 1 },
    { name: "1–1.5 km", max: 1.5 },
    { name: "1.5–2 km", max: 2 },
  ];
  const counts = buckets.map(() => 0);
  for (const h of withDistance) {
    const d = h.distanceKm!;
    const idx = buckets.findIndex((b) => d <= b.max);
    if (idx >= 0) counts[idx] += 1;
    else counts[buckets.length - 1] += 1;
  }
  return buckets
    .map((b, i) => ({
      name: b.name,
      value: counts[i],
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .filter((d) => d.value > 0);
}

export function hospitalsOpenStatus(hospitals: NearbyHospital[]): ChartDatum[] {
  let open = 0;
  let closed = 0;
  let unknown = 0;
  for (const h of hospitals) {
    if (h.openNow === true) open += 1;
    else if (h.openNow === false) closed += 1;
    else unknown += 1;
  }
  const out: ChartDatum[] = [];
  if (open) out.push({ name: "Open now", value: open, fill: CHART_COLORS[0] });
  if (closed) out.push({ name: "Closed", value: closed, fill: CHART_COLORS[3] });
  if (unknown) out.push({ name: "Hours unknown", value: unknown, fill: CHART_COLORS[7] });
  return out;
}

export function topHospitalsByProximity(hospitals: NearbyHospital[], limit = 6): ChartDatum[] {
  return [...hospitals]
    .filter((h) => h.distanceKm != null)
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, limit)
    .map((h, i) => ({
      name: h.name.length > 22 ? `${h.name.slice(0, 20)}…` : h.name,
      value: Math.round((h.distanceKm ?? 0) * 10) / 10,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
}
