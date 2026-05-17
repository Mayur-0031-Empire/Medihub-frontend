import { AppointmentNotificationList } from "@/components/notifications/AppointmentNotificationList";
import { usePatientNotifications } from "@/hooks/usePatientNotifications";
import { patientNotificationHref } from "@/lib/appointments/patientNotifications";
import { isServerConfigured } from "@/lib/api";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export function PatientNotificationsPage() {
  const serverOk = isServerConfigured();
  const { items, loading, error, fallbackHint, refresh, markAllRead } = usePatientNotifications(serverOk);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard/patient" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to home
      </Link>
      <div className="mt-4 flex items-start gap-3">
        <Bell className="h-8 w-8 shrink-0 text-teal-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-slate-600">
            Visits, prescriptions, and files your doctor shared with you.
          </p>
        </div>
      </div>
      <AppointmentNotificationList
        items={items}
        loading={loading}
        error={error}
        fallbackHint={fallbackHint}
        emptyMessage="No notifications yet. When you book a visit or your doctor adds a prescription or files, they will appear here."
        linkForAppointment={patientNotificationHref}
        onRefresh={refresh}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}
