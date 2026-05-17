import { fetchAppointmentNotifications } from "@/lib/api/appointments";
import { formatSlotRange } from "@/lib/appointments/local";
import { loadPatientMedicalArchive } from "@/lib/appointments/medicalArchive";
import {
  applyPatientNotificationReadState,
  markPatientNotificationsRead,
} from "@/lib/appointments/patientNotificationState";
import { countUnreadNotifications } from "@/lib/appointments/notifications";
import type { AppointmentFileRef, AppointmentNotification } from "@/types/appointment";
import { userFacingError } from "@/lib/userMessages";

const UPCOMING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_MS = 30 * 24 * 60 * 60 * 1000;

function doctorFilesSignature(files: AppointmentFileRef[]): string {
  return files
    .map((f) => f.url ?? f.title ?? f.name ?? "")
    .sort()
    .join("|");
}

async function notificationsFromVisitArchive(): Promise<AppointmentNotification[]> {
  const entries = await loadPatientMedicalArchive();
  const now = Date.now();
  const items: AppointmentNotification[] = [];

  for (const entry of entries) {
    const a = entry.appointment;
    const detail = entry.detail;
    const when = a.startAt ? formatSlotRange(a.startAt, a.endAt) : "Scheduled";
    const doctor = a.doctorName;
    const status = a.status.toLowerCase();
    const createdAt = a.createdAt ?? a.startAt;
    const activityAt = new Date(createdAt ?? 0).getTime();
    const startAt = new Date(a.startAt ?? 0).getTime();

    if (!Number.isFinite(activityAt) || now - activityAt > RECENT_ACTIVITY_MS) {
      if (!Number.isFinite(startAt) || now - startAt > RECENT_ACTIVITY_MS) continue;
    }

    if (status.includes("cancel")) {
      items.push({
        _id: `cancel-${a._id}`,
        kind: "cancellation",
        message: `Your visit with ${doctor} was cancelled.`,
        createdAt,
        appointmentId: a._id,
        source: "sync",
      });
      continue;
    }

    const isUpcoming =
      Number.isFinite(startAt) && startAt >= now - 24 * 60 * 60 * 1000 && startAt <= now + UPCOMING_WINDOW_MS;
    const isRecentBooking =
      Number.isFinite(activityAt) && now - activityAt <= 7 * 24 * 60 * 60 * 1000;

    if (isUpcoming || isRecentBooking) {
      items.push({
        _id: `visit-${a._id}`,
        kind: "appointment",
        message: isUpcoming
          ? `Upcoming video visit with ${doctor} — ${when}.`
          : `Visit booked with ${doctor} — ${when}.`,
        createdAt,
        appointmentId: a._id,
        source: "sync",
      });
    }

    if (entry.hasPrescription) {
      const approved = Boolean(detail?.approvedPrescription?.trim());
      items.push({
        _id: approved ? `rx-approved-${a._id}` : `rx-${a._id}`,
        kind: "prescription",
        message: approved
          ? `Prescription ready from ${doctor} for your visit (${when}).`
          : `Prescription update from ${doctor} — review on your visit page.`,
        createdAt,
        appointmentId: a._id,
        source: "sync",
      });
    }

    if (entry.hasDoctorFiles) {
      const sig = doctorFilesSignature(entry.doctorFiles);
      items.push({
        _id: `files-${a._id}-${sig.length}`,
        kind: "doctor_files",
        message: `${doctor} shared ${entry.doctorFiles.length} file${
          entry.doctorFiles.length === 1 ? "" : "s"
        } for your visit.`,
        createdAt,
        appointmentId: a._id,
        source: "sync",
      });
    }
  }

  return items
    .sort((x, y) => (y.createdAt ?? "").localeCompare(x.createdAt ?? ""))
    .slice(0, 40);
}

/** Patient notifications: API first, then visit archive (prescriptions, doctor files, bookings). */
export async function loadPatientNotifications(): Promise<{
  items: AppointmentNotification[];
  source: "api" | "sync" | "mixed";
  apiError?: string;
}> {
  let apiItems: AppointmentNotification[] = [];
  let apiError: string | undefined;

  try {
    apiItems = await fetchAppointmentNotifications();
  } catch (e) {
    apiError = userFacingError(e, "Could not load notifications.");
  }

  let items = apiItems;
  let source: "api" | "sync" | "mixed" = apiItems.length > 0 ? "api" : "sync";

  if (apiItems.length === 0) {
    try {
      items = await notificationsFromVisitArchive();
      source = "sync";
    } catch (e) {
      return {
        items: [],
        source: "sync",
        apiError: apiError ?? userFacingError(e, "Could not load notifications."),
      };
    }
  }

  return {
    items: applyPatientNotificationReadState(items),
    source,
    apiError,
  };
}

export function patientNotificationHref(
  appointmentId: string,
  kind?: AppointmentNotification["kind"],
): string {
  switch (kind) {
    case "prescription":
    case "doctor_files":
      return `/dashboard/patient/documents#visit-${appointmentId}`;
    case "appointment":
      return `/dashboard/patient/consult/${appointmentId}`;
    case "cancellation":
      return `/dashboard/patient/appointments/${appointmentId}`;
    default:
      return `/dashboard/patient/appointments/${appointmentId}`;
  }
}

export function markAllPatientNotificationsRead(items: AppointmentNotification[]): void {
  markPatientNotificationsRead(items.map((n) => n._id));
}

export { countUnreadNotifications };
