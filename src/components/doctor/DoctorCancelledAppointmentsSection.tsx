import { fetchMyAppointments, isServerConfigured, restoreAppointmentByDoctor, userFacingError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formatAppointmentStatus, formatSlotRange, isAppointmentCancelled, patientDisplayName } from "@/lib/appointments";
import type { PatientAppointment } from "@/types/appointment";
import { ArchiveRestore, CalendarClock, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  /** When set, only show this many items (profile sidebar). */
  limit?: number;
  className?: string;
};

export function DoctorCancelledAppointmentsSection({ limit, className }: Props) {
  const serverOk = isServerConfigured();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchMyAppointments();
      setAppointments(rows.filter((a) => isAppointmentCancelled(a.status)));
    } catch (e) {
      setLoadError(userFacingError(e, "Could not load appointments."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRestore(appointmentId: string) {
    if (!window.confirm("Restore this visit to your schedule? The patient can attend again.")) return;
    setRestoringId(appointmentId);
    try {
      await restoreAppointmentByDoctor(appointmentId);
      notifySuccess("Appointment restored.");
      await load();
    } catch (e) {
      notifyError(userFacingError(e, "Could not restore appointment."));
    } finally {
      setRestoringId(null);
    }
  }

  if (!serverOk) return null;

  const visible = limit ? appointments.slice(0, limit) : appointments;

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ArchiveRestore className="h-5 w-5 text-teal-600" aria-hidden />
            Cancelled visits
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Visits you cancelled can be added back to your schedule so the patient can attend again.
          </p>
        </div>
        <Link
          to="/dashboard/doctor/appointments"
          className="text-xs font-semibold text-teal-700 hover:underline"
        >
          All appointments →
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-label="Loading" />
        </div>
      ) : null}

      {loadError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</p>
      ) : null}

      {!loading && visible.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">No cancelled appointments.</p>
      ) : null}

      {!loading && visible.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {visible.map((a) => {
            const busy = restoringId === a._id;
            return (
              <li
                key={a._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{patientDisplayName(a)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {a.startAt ? formatSlotRange(a.startAt, a.endAt) : "Time TBC"}
                    <span className="text-slate-400">·</span>
                    {formatAppointmentStatus(a.status)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/dashboard/doctor/appointments/${a._id}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onRestore(a._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
                    Restore
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {limit && appointments.length > limit ? (
        <p className="mt-3 text-center text-xs text-slate-500">
          Showing {limit} of {appointments.length}.{" "}
          <Link to="/dashboard/doctor/appointments" className="font-semibold text-teal-700 hover:underline">
            See all
          </Link>
        </p>
      ) : null}
    </section>
  );
}
