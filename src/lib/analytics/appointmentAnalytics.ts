import type { ChartDateRange } from "@/lib/analytics/dateRange";
import { appointmentInRange } from "@/lib/analytics/dateRange";
import type { AppointmentDetail, PatientAppointment } from "@/types/appointment";

export type ChartDatum = { name: string; value: number; fill?: string };

const TEAL = "#0d9488";
const SKY = "#0284c7";
const AMBER = "#d97706";
const ROSE = "#e11d48";
const SLATE = "#64748b";
const VIOLET = "#7c3aed";

export const CHART_COLORS = [TEAL, SKY, VIOLET, AMBER, ROSE, "#059669", "#6366f1", SLATE];

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameLocalDay(iso: string | undefined, ref = new Date()): boolean {
  if (!iso) return false;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  return startOfLocalDay(t).getTime() === startOfLocalDay(ref).getTime();
}

function normalizeStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("complete") || s.includes("done") || s.includes("finished")) return "Completed";
  if (s.includes("progress") || s.includes("live") || s.includes("active")) return "In progress";
  return "Scheduled";
}

function illnessLabel(raw: string | undefined): string {
  if (!raw?.trim()) return "Not specified";
  const line = raw.split(/[\n,;|]/)[0]?.trim() ?? "";
  const short = line.slice(0, 48);
  if (!short) return "Not specified";
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function filterTodayAppointments(appointments: PatientAppointment[], ref = new Date()) {
  return appointments.filter((a) => isSameLocalDay(a.startAt, ref) || isSameLocalDay(a.createdAt, ref));
}

function appointmentTimestamp(a: PatientAppointment): string | undefined {
  return a.startAt ?? a.createdAt;
}

export function filterAppointmentsByRange(
  appointments: PatientAppointment[],
  range: ChartDateRange,
): PatientAppointment[] {
  return appointments.filter((a) => appointmentInRange(appointmentTimestamp(a), range));
}

function bumpChart(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapToChartData(map: Map<string, number>, limit = 10): ChartDatum[] {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

/** Visits grouped by status for any date range. */
export function appointmentsByStatus(
  appointments: PatientAppointment[],
  range?: ChartDateRange,
): ChartDatum[] {
  const rows = range ? filterAppointmentsByRange(appointments, range) : appointments;
  const map = new Map<string, number>();
  for (const a of rows) bumpChart(map, normalizeStatus(a.status));
  const order = ["Scheduled", "In progress", "Completed", "Cancelled"];
  return order
    .filter((name) => (map.get(name) ?? 0) > 0)
    .map((name, i) => ({ name, value: map.get(name) ?? 0, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

/** Daily booking counts within a range (for trend charts). */
export function appointmentsByDay(appointments: PatientAppointment[], range: ChartDateRange): ChartDatum[] {
  const rows = filterAppointmentsByRange(appointments, range);
  const map = new Map<string, number>();
  for (const a of rows) {
    const iso = appointmentTimestamp(a);
    if (!iso) continue;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    bumpChart(map, key);
  }
  return mapToChartData(map, 14);
}

/** Doctors per hospital from bookings in range. */
export function doctorsPerHospitalFromAppointments(appointments: PatientAppointment[], range: ChartDateRange): ChartDatum[] {
  const rows = filterAppointmentsByRange(appointments, range);
  const map = new Map<string, number>();
  for (const a of rows) {
    const hospital = a.hospitalName?.trim() || "Hospital not listed";
    bumpChart(map, hospital);
  }
  return mapToChartData(map, 12);
}

/** Specialty distribution from bookings in range. */
export function specialtiesFromAppointments(appointments: PatientAppointment[], range: ChartDateRange): ChartDatum[] {
  const rows = filterAppointmentsByRange(appointments, range);
  const map = new Map<string, number>();
  for (const a of rows) {
    const specialty = a.specialization?.trim() || "General practice";
    bumpChart(map, specialty);
  }
  return mapToChartData(map, 8);
}

export function appointmentsByTimeSlot(
  appointments: PatientAppointment[],
  range?: ChartDateRange,
): ChartDatum[] {
  const rows = range ? filterAppointmentsByRange(appointments, range) : appointments;
  const slots = [
    { name: "Morning", start: 5, end: 12 },
    { name: "Afternoon", start: 12, end: 17 },
    { name: "Evening", start: 17, end: 22 },
    { name: "Night", start: 22, end: 24 },
  ];
  const counts = slots.map(() => 0);
  for (const a of rows) {
    if (!a.startAt) continue;
    const h = new Date(a.startAt).getHours();
    const idx = slots.findIndex((s) => h >= s.start && h < s.end);
    if (idx >= 0) counts[idx] += 1;
    else if (h < 5) counts[3] += 1;
  }
  return slots.map((s, i) => ({
    name: s.name,
    value: counts[i],
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** Today's visits grouped by status (scheduled, completed, cancelled, …). */
export function todayAppointmentsByStatus(appointments: PatientAppointment[], ref = new Date()): ChartDatum[] {
  const today = filterTodayAppointments(appointments, ref);
  const map = new Map<string, number>();
  for (const a of today) bump(map, normalizeStatus(a.status));
  const order = ["Scheduled", "In progress", "Completed", "Cancelled"];
  return order
    .filter((name) => (map.get(name) ?? 0) > 0)
    .map((name, i) => ({ name, value: map.get(name) ?? 0, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

/** Today's visits by time of day. */
export function todayAppointmentsByTimeSlot(appointments: PatientAppointment[], ref = new Date()): ChartDatum[] {
  const today = filterTodayAppointments(appointments, ref);
  const slots = [
    { name: "Morning", start: 5, end: 12 },
    { name: "Afternoon", start: 12, end: 17 },
    { name: "Evening", start: 17, end: 22 },
    { name: "Night", start: 22, end: 24 },
  ];
  const counts = slots.map(() => 0);
  for (const a of today) {
    if (!a.startAt) continue;
    const h = new Date(a.startAt).getHours();
    const idx = slots.findIndex((s) => h >= s.start && h < s.end);
    if (idx >= 0) counts[idx] += 1;
    else if (h < 5) counts[3] += 1;
  }
  return slots.map((s, i) => ({
    name: s.name,
    value: counts[i],
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** Patient concerns from symptoms; diagnosis from detail when available. */
export function patientIllnessBreakdown(
  appointments: PatientAppointment[],
  detailsById: Map<string, AppointmentDetail> = new Map(),
  range?: ChartDateRange,
): ChartDatum[] {
  const rows = range ? filterAppointmentsByRange(appointments, range) : appointments;
  const map = new Map<string, number>();
  for (const a of rows) {
    const detail = detailsById.get(a._id);
    const diagnosis = detail?.doctorDiagnosis?.trim();
    if (diagnosis) bump(map, illnessLabel(diagnosis));
    else if (a.symptoms?.trim()) bump(map, illnessLabel(a.symptoms));
    else bump(map, "Not specified");
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

/** Admin: bookings per doctor. */
export function appointmentsByDoctor(appointments: PatientAppointment[], range?: ChartDateRange): ChartDatum[] {
  const rows = range ? filterAppointmentsByRange(appointments, range) : appointments;
  const map = new Map<string, number>();
  for (const a of rows) {
    const name = a.doctorName?.trim() || "Unknown doctor";
    bump(map, name);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

/** Admin: patients with prescription / treatment documented per doctor. */
export function treatmentsByDoctor(
  appointments: PatientAppointment[],
  detailsById: Map<string, AppointmentDetail> = new Map(),
  range?: ChartDateRange,
): ChartDatum[] {
  const rows = range ? filterAppointmentsByRange(appointments, range) : appointments;
  const map = new Map<string, number>();
  for (const a of rows) {
    const detail = detailsById.get(a._id);
    const hasTreatment =
      Boolean(detail?.approvedPrescription?.trim()) ||
      Boolean(detail?.prescriptionText?.trim()) ||
      Boolean(detail?.prescriptionDraft?.trim()) ||
      Boolean(detail?.doctorDiagnosis?.trim());
    if (!hasTreatment) continue;
    const name = a.doctorName?.trim() || "Unknown doctor";
    bump(map, name);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

export async function loadAppointmentDetails(
  appointments: PatientAppointment[],
  fetchDetail: (id: string) => Promise<AppointmentDetail>,
  limit = 12,
): Promise<Map<string, AppointmentDetail>> {
  const ids = appointments.slice(0, limit).map((a) => a._id);
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const detail = await fetchDetail(id);
        return [id, detail] as const;
      } catch {
        return null;
      }
    }),
  );
  return new Map(entries.filter((e): e is [string, AppointmentDetail] => e != null));
}
