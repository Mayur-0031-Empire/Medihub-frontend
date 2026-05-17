import type { AppointmentSlot } from "@/types/appointment";

/** Ignore slots that already started or are within one minute of start (matches typical server rules). */
const BOOKING_LEAD_MS = 60_000;

export function isSlotBookable(slot: AppointmentSlot, now = new Date()): boolean {
  const start = new Date(slot.startAt).getTime();
  const end = new Date(slot.endAt).getTime();
  const t = now.getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return start > t + BOOKING_LEAD_MS && end > t;
}

export function filterBookableSlots(slots: AppointmentSlot[], now = new Date()): AppointmentSlot[] {
  return slots.filter((s) => isSlotBookable(s, now));
}

export function isSlotUnavailableMessage(message: string): boolean {
  return /no longer available|already booked|not available|slot.*taken|slot.*booked/i.test(message);
}

export function formatConsultationFee(fee: number): string {
  if (!Number.isFinite(fee) || fee <= 0) return "Fee on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(fee);
}

export function formatSlotRange(startAt: string, endAt?: string): string {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return startAt;
  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!endAt) return `${date} · ${time}`;
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) return `${date} · ${time}`;
  const endTime = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time} – ${endTime}`;
}

export function formatAppointmentStatus(status: string): string {
  const s = status.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function slotDayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function slotDayLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dayKey;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const key = d.toISOString().slice(0, 10);
  const todayKey = today.toISOString().slice(0, 10);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  if (key === todayKey) return "Today";
  if (key === tomorrowKey) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
