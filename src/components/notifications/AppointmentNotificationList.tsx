import type { AppointmentNotification } from "@/types/appointment";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  items: AppointmentNotification[];
  loading: boolean;
  error: string | null;
  fallbackHint?: string | null;
  emptyMessage: string;
  linkForAppointment: (appointmentId: string, kind?: AppointmentNotification["kind"]) => string;
  linkLabel?: string;
  onRefresh: () => void;
  onMarkAllRead?: () => void;
};

function kindLabel(kind?: AppointmentNotification["kind"]): string | null {
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
      return null;
  }
}

export function AppointmentNotificationList({
  items,
  loading,
  error,
  fallbackHint,
  emptyMessage,
  linkForAppointment,
  linkLabel = "Open",
  onRefresh,
  onMarkAllRead,
}: Props) {
  return (
    <>
      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading" />
        </div>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {fallbackHint && !error ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {fallbackHint}
        </p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
          {emptyMessage}
        </p>
      ) : null}
      {!loading && items.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-2">
          {items.map((n) => {
            const tag = kindLabel(n.kind);
            return (
              <li
                key={n._id}
                className={[
                  "rounded-xl border px-4 py-3 text-sm",
                  n.read ? "border-slate-200 bg-white text-slate-700" : "border-teal-200 bg-teal-50/80 text-slate-900",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {tag ? (
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800 ring-1 ring-teal-200">
                      {tag}
                    </span>
                  ) : null}
                  {!n.read ? (
                    <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="Unread" />
                  ) : null}
                </div>
                <p className="mt-1">{n.message}</p>
                {n.createdAt ? <p className="mt-1 text-xs text-slate-500">{n.createdAt}</p> : null}
                {n.appointmentId ? (
                  <Link
                    to={linkForAppointment(n.appointmentId, n.kind)}
                    className="mt-2 inline-block text-xs font-semibold text-teal-700 hover:underline"
                  >
                    {n.kind === "prescription" || n.kind === "doctor_files"
                      ? "View documents"
                      : n.kind === "appointment"
                        ? "Join / view visit"
                        : linkLabel}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {!loading ? (
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Refresh
          </button>
          {onMarkAllRead && items.some((n) => !n.read) ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
