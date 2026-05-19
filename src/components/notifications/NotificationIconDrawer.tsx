import type { AppointmentNotification } from "@/types/appointment";
import { Bell, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  items: AppointmentNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  title: string;
  emptyMessage: string;
  linkForAppointment: (appointmentId: string, kind?: AppointmentNotification["kind"]) => string;
  linkLabel?: string;
  onRefresh: () => void;
  onMarkAllRead?: () => void;
};

const bellClass =
  "relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";

function kindLabel(kind?: AppointmentNotification["kind"]): string {
  switch (kind) {
    case "prescription":
      return "Prescription";
    case "doctor_files":
      return "Doctor files";
    case "appointment":
      return "Visit";
    case "cancellation":
      return "Cancelled";
    default:
      return "Notice";
  }
}

function notificationLinkText(kind?: AppointmentNotification["kind"], fallback = "Open"): string {
  if (kind === "prescription" || kind === "doctor_files") return "View documents";
  if (kind === "appointment") return "Join / view visit";
  return fallback;
}

export function NotificationIconDrawer({
  items,
  unreadCount,
  loading,
  error,
  title,
  emptyMessage,
  linkForAppointment,
  linkLabel = "Open",
  onRefresh,
  onMarkAllRead,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={bellClass}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
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
      </button>

      <div
        className={[
          "absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(92vw,24rem)] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 transition duration-200 dark:border-slate-700 dark:bg-slate-900",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
            <p className="text-xs text-slate-500">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void onRefresh()}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Refresh notifications"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[min(62vh,28rem)] overflow-y-auto p-2">
          {error ? (
            <p className="m-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
          ) : null}
          {items.slice(0, 8).map((n) => (
            <div
              key={n._id}
              className={[
                "rounded-xl border px-3 py-2.5 text-sm",
                n.read
                  ? "border-transparent text-slate-700 dark:text-slate-200"
                  : "border-teal-200 bg-teal-50/80 text-slate-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-slate-100",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800 ring-1 ring-teal-200 dark:bg-slate-900 dark:text-teal-300 dark:ring-teal-800">
                  {kindLabel(n.kind)}
                </span>
                {!n.read ? <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="Unread" /> : null}
              </div>
              <p className="mt-1 line-clamp-2">{n.message}</p>
              {n.appointmentId ? (
                <Link
                  to={linkForAppointment(n.appointmentId, n.kind)}
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-block text-xs font-semibold text-teal-700 hover:underline dark:text-teal-300"
                >
                  {notificationLinkText(n.kind, linkLabel)}
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="text-sm font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300"
          >
            Refresh
          </button>
          {onMarkAllRead && items.some((n) => !n.read) ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
