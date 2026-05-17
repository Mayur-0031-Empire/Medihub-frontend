import { AdminAppointmentList } from "@/components/admin/AdminAppointmentList";
import { fetchAdminAppointments, isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import type { PatientAppointment } from "@/types/appointment";
import { ClipboardList, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function AdminAppointmentsPage() {
  const serverOk = isServerConfigured();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setError(null);
    try {
      setAppointments(await fetchAdminAppointments());
    } catch (e) {
      setError(userFacingError(e, "Could not load appointments."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">Appointments</h1>
        <p className="mt-2 text-sm">{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/dashboard/admin" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to admin home
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
          <ClipboardList className="h-8 w-8 shrink-0 text-violet-600" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Doctor ↔ patient bookings</h1>
            <p className="mt-1 text-slate-600">
              See which patient is booked with which doctor across the network.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/admin/manage-slots"
          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          Manage doctor slots
        </Link>
      </div>
      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading" />
        </div>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <div className="mt-8">
          <AdminAppointmentList appointments={appointments} />
        </div>
      ) : null}
    </div>
  );
}
