import type { AppointmentNotification } from "@/types/appointment";

const STORAGE_KEY = "medihub_patient_notifications_read";

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* quota / private mode */
  }
}

export function markPatientNotificationsRead(ids: string[]): void {
  if (ids.length === 0) return;
  const seen = readIds();
  for (const id of ids) seen.add(id);
  writeIds(seen);
}

export function applyPatientNotificationReadState(
  items: AppointmentNotification[],
): AppointmentNotification[] {
  const seen = readIds();
  return items.map((n) => ({
    ...n,
    read: Boolean(n.read) || seen.has(n._id),
  }));
}
