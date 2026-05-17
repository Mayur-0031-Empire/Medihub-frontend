import { usePatientNotifications } from "@/hooks/usePatientNotifications";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

const bellClass =
  "relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900";

export function PatientNotificationBell() {
  const { unreadCount, loading } = usePatientNotifications(true);

  return (
    <Link
      to="/dashboard/patient/notifications"
      className={bellClass}
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
          : "Notifications"
      }
    >
      <Bell className="h-5 w-5" aria-hidden />
      {!loading && unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
