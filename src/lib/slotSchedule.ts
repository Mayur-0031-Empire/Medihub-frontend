import type { AppointmentSlotInput } from "@/types/appointment";

/** Build ISO start/end for a local calendar day + HH:mm time. */
export function buildSlotRange(
  dayKey: string,
  startTime: string,
  durationMinutes: number,
): AppointmentSlotInput {
  const [h, m] = startTime.split(":").map((x) => Number(x));
  const start = new Date(`${dayKey}T00:00:00`);
  start.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

/** Generate slots between two times on one day (exclusive of `toTime`). */
export function generateDaySlots(
  dayKey: string,
  fromTime: string,
  toTime: string,
  durationMinutes: number,
): AppointmentSlotInput[] {
  const [fromH, fromM] = fromTime.split(":").map(Number);
  const [toH, toM] = toTime.split(":").map(Number);
  const dayStart = new Date(`${dayKey}T00:00:00`);
  const cursor = new Date(dayStart);
  cursor.setHours(fromH, fromM, 0, 0);
  const endBound = new Date(dayStart);
  endBound.setHours(toH, toM, 0, 0);
  const out: AppointmentSlotInput[] = [];
  while (cursor.getTime() + durationMinutes * 60_000 <= endBound.getTime()) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);
    out.push({ startAt: cursor.toISOString(), endAt: slotEnd.toISOString() });
    cursor.setTime(cursor.getTime() + durationMinutes * 60_000);
  }
  return out;
}

/** Local calendar date `YYYY-MM-DD` (not UTC). */
export function localDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayDayKey(): string {
  return localDayKey();
}
