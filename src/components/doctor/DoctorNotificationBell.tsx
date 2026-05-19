import { useDoctorNotifications } from "@/hooks/useDoctorNotifications";
import { NotificationIconDrawer } from "@/components/notifications/NotificationIconDrawer";

export function DoctorNotificationBell() {
  const { items, unreadCount, loading, error, refresh } = useDoctorNotifications(true);

  return (
    <NotificationIconDrawer
      items={items}
      unreadCount={unreadCount}
      loading={loading}
      error={error}
      title="Doctor notifications"
      emptyMessage="No notifications yet. New patient bookings will appear here."
      linkForAppointment={(id) => `/dashboard/doctor/appointments/${id}`}
      linkLabel="Open appointment"
      onRefresh={refresh}
    />
  );
}
