import { AppointmentNotificationList } from "@/components/notifications/AppointmentNotificationList";
import { useDoctorNotifications } from "@/hooks/useDoctorNotifications";
import { isServerConfigured } from "@/lib/api";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export function DoctorNotificationsPage() {
  const serverOk = isServerConfigured();
  const { items, loading, error, fallbackHint, refresh } = useDoctorNotifications(serverOk);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard/doctor" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to workspace
      </Link>
      <div className="mt-4 flex items-start gap-3">
        <Bell className="h-8 w-8 shrink-0 text-teal-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-slate-600">Booking alerts and appointment updates for your practice.</p>
        </div>
      </div>

      <AppointmentNotificationList
        items={items}
        loading={loading}
        error={error}
        fallbackHint={fallbackHint}
        emptyMessage="No notifications yet. New patient bookings will appear here."
        linkForAppointment={(id) => `/dashboard/doctor/appointments/${id}`}
        linkLabel="Open appointment"
        onRefresh={refresh}
      />
    </div>
  );
}
