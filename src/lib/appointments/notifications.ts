import { userFacingError } from "@/lib/userMessages";
import { fetchAppointmentNotifications, fetchMyAppointments } from "@/lib/api/appointments";
import { formatSlotRange } from "@/lib/appointments/local";
import { patientDisplayName } from "@/lib/appointments/normalize";
import type { AppointmentNotification } from "@/types/appointment";
import type { PatientAppointment } from "@/types/appointment";

function notificationsFromAppointments(appts: PatientAppointment[]): AppointmentNotification[] {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  return appts
    .filter((a) => {
      const t = new Date(a.createdAt ?? a.startAt ?? 0).getTime();
      return Number.isFinite(t) && t >= weekAgo;
    })
    .sort((a, b) => (b.createdAt ?? b.startAt ?? "").localeCompare(a.createdAt ?? a.startAt ?? ""))
    .slice(0, 20)
    .map((a) => {
      const when = a.startAt ? formatSlotRange(a.startAt, a.endAt) : "Scheduled";
      const patient = patientDisplayName(a);
      return {
        _id: `appt-${a._id}`,
        message: `Appointment with ${patient} — ${when} (${a.status})`,
        read: a.status.toLowerCase().includes("complete"),
        createdAt: a.createdAt ?? a.startAt,
        appointmentId: a._id,
        source: "appointment",
      };
    });
}

/** Notifications from API, with appointment-based fallback when the API is empty or fails. */
export async function loadDoctorNotifications(): Promise<{
  items: AppointmentNotification[];
  source: "api" | "appointments" | "mixed";
  apiError?: string;
}> {
  let apiItems: AppointmentNotification[] = [];
  let apiError: string | undefined;

  try {
    apiItems = await fetchAppointmentNotifications();
  } catch (e) {
    apiError = userFacingError(e, "Could not load notifications.");
  }

  if (apiItems.length > 0) {
    return { items: apiItems, source: "api", apiError };
  }

  try {
    const fromAppts = notificationsFromAppointments(await fetchMyAppointments());
    return { items: fromAppts, source: "appointments", apiError };
  } catch (e) {
    return {
      items: [],
      source: "appointments",
      apiError: apiError ?? userFacingError(e, "Could not load notifications."),
    };
  }
}

export function countUnreadNotifications(items: AppointmentNotification[]): number {
  return items.filter((n) => !n.read).length;
}
