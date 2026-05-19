import { usePatientNotifications } from "@/hooks/usePatientNotifications";
import { patientNotificationHref } from "@/lib/appointments/patientNotifications";
import { NotificationIconDrawer } from "@/components/notifications/NotificationIconDrawer";

export function PatientNotificationBell() {
  const { items, unreadCount, loading, error, refresh, markAllRead } = usePatientNotifications(true);

  return (
    <NotificationIconDrawer
      items={items}
      unreadCount={unreadCount}
      loading={loading}
      error={error}
      title="Patient notifications"
      emptyMessage="No notifications yet. When you book a visit or your doctor adds files, they will appear here."
      linkForAppointment={patientNotificationHref}
      onRefresh={refresh}
      onMarkAllRead={markAllRead}
    />
  );
}
