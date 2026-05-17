import { AnalyticsChartPanel } from "@/components/charts/AnalyticsChartPanel";
import { fetchAdminAppointments, fetchAppointmentById, isServerConfigured } from "@/lib/api";
import { userFacingError } from "@/lib/userMessages";
import {
  appointmentsByDoctor,
  appointmentsByStatus,
  appointmentsByDay,
  loadAppointmentDetails,
  treatmentsByDoctor,
} from "@/lib/analytics/appointmentAnalytics";
import { defaultChartDateRange, type ChartDateRange } from "@/lib/analytics/dateRange";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { AppointmentDetail, PatientAppointment } from "@/types/appointment";

function hasValues(data: { value: number }[]): boolean {
  return data.some((d) => d.value > 0);
}

function useChartDateState() {
  return useState<ChartDateRange>(defaultChartDateRange);
}

export function AdminDashboardCharts() {
  const serverOk = isServerConfigured();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [details, setDetails] = useState<Map<string, AppointmentDetail>>(new Map());

  const [doctorRange, setDoctorRange] = useChartDateState();
  const [treatmentsRange, setTreatmentsRange] = useChartDateState();
  const [statusRange, setStatusRange] = useChartDateState();
  const [trendRange, setTrendRange] = useChartDateState();

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setError(null);
    try {
      const appts = await fetchAdminAppointments();
      setAppointments(appts);
      const detailMap = await loadAppointmentDetails(appts, fetchAppointmentById, 40);
      setDetails(detailMap);
    } catch (e) {
      setAppointments([]);
      setDetails(new Map());
      setError(userFacingError(e, "Could not load booking data for charts."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  const byDoctor = useMemo(
    () => appointmentsByDoctor(appointments, doctorRange),
    [appointments, doctorRange],
  );

  const treatments = useMemo(
    () => treatmentsByDoctor(appointments, details, treatmentsRange),
    [appointments, details, treatmentsRange],
  );

  const statusChart = useMemo(
    () => appointmentsByStatus(appointments, statusRange),
    [appointments, statusRange],
  );

  const trendChart = useMemo(
    () => appointmentsByDay(appointments, trendRange),
    [appointments, trendRange],
  );

  const filteredCount = (range: ChartDateRange) =>
    appointments.filter((a) => {
      const iso = a.startAt ?? a.createdAt;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= range.from.getTime() && t <= range.to.getTime();
    }).length;

  if (!serverOk) return null;

  if (loading) {
    return (
      <section className="mt-8" aria-busy="true">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Network overview
        </h2>
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          Loading booking charts…
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Network overview
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Platform-wide bookings and treatments. Each chart has its own date filter for historical data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      {!error && appointments.length > 0 ? (
        <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100">
          <span className="font-semibold">{appointments.length}</span> total booking
          {appointments.length === 1 ? "" : "s"} loaded.{" "}
          <Link to="/dashboard/admin/appointments" className="font-semibold text-violet-800 underline hover:text-violet-900 dark:text-violet-300">
            View all bookings
          </Link>
        </p>
      ) : null}

      {!error && appointments.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          No bookings in the system yet. Charts will populate when patients book doctors.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AnalyticsChartPanel
          title="Patients per doctor"
          description="Bookings grouped by doctor in the selected period"
          data={byDoctor}
          chartKind="ranking"
          categoryAxisLabel="Doctor"
          valueAxisLabel="Patients"
          valueLabel="patients"
          isEmpty={!hasValues(byDoctor)}
          dateRange={doctorRange}
          onDateRangeChange={setDoctorRange}
          dateHint={
            filteredCount(doctorRange) > 0
              ? `${filteredCount(doctorRange)} booking(s) in range.`
              : undefined
          }
        />
        <AnalyticsChartPanel
          title="Treatments by doctor"
          description="Visits with diagnosis or prescription documented"
          data={treatments}
          chartKind="ranking"
          categoryAxisLabel="Doctor"
          valueAxisLabel="Treatments"
          valueLabel="treatments"
          isEmpty={!hasValues(treatments)}
          dateRange={treatmentsRange}
          onDateRangeChange={setTreatmentsRange}
        />
        <AnalyticsChartPanel
          title="Bookings by status"
          description="Scheduled, completed, cancelled, and in-progress"
          data={statusChart}
          chartKind="categorical"
          categoryAxisLabel="Status"
          valueAxisLabel="Bookings"
          valueLabel="bookings"
          isEmpty={!hasValues(statusChart)}
          dateRange={statusRange}
          onDateRangeChange={setStatusRange}
        />
        <AnalyticsChartPanel
          title="Bookings over time"
          description="Daily volume across the platform"
          data={trendChart}
          chartKind="timeSeries"
          categoryAxisLabel="Day"
          valueAxisLabel="Bookings"
          valueLabel="bookings"
          isEmpty={!hasValues(trendChart)}
          dateRange={trendRange}
          onDateRangeChange={setTrendRange}
        />
      </div>
    </section>
  );
}
