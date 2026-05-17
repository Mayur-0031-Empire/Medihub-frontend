import { AnalyticsChartPanel } from "@/components/charts/AnalyticsChartPanel";
import { fetchAppointmentById, fetchMyAppointments, isServerConfigured } from "@/lib/api";
import {
  appointmentsByStatus,
  appointmentsByTimeSlot,
  loadAppointmentDetails,
  patientIllnessBreakdown,
} from "@/lib/analytics/appointmentAnalytics";
import { defaultChartDateRange, type ChartDateRange } from "@/lib/analytics/dateRange";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppointmentDetail, PatientAppointment } from "@/types/appointment";

function hasValues(data: { value: number }[]): boolean {
  return data.some((d) => d.value > 0);
}

function useChartDateState() {
  return useState<ChartDateRange>(defaultChartDateRange);
}

export function DoctorDashboardCharts() {
  const serverOk = isServerConfigured();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [details, setDetails] = useState<Map<string, AppointmentDetail>>(new Map());

  const [statusRange, setStatusRange] = useChartDateState();
  const [timeRange, setTimeRange] = useChartDateState();
  const [illnessRange, setIllnessRange] = useChartDateState();

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    try {
      const appts = await fetchMyAppointments();
      setAppointments(appts);
      const detailMap = await loadAppointmentDetails(appts, fetchAppointmentById, 40);
      setDetails(detailMap);
    } catch {
      setAppointments([]);
      setDetails(new Map());
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusChart = useMemo(
    () => appointmentsByStatus(appointments, statusRange),
    [appointments, statusRange],
  );

  const timeChart = useMemo(
    () => appointmentsByTimeSlot(appointments, timeRange).filter((d) => d.value > 0),
    [appointments, timeRange],
  );

  const illnessChart = useMemo(
    () => patientIllnessBreakdown(appointments, details, illnessRange),
    [appointments, details, illnessRange],
  );

  if (!serverOk) return null;

  if (loading) {
    return (
      <section className="mt-8" aria-busy="true">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Practice analytics
        </h2>
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          Loading charts…
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Practice analytics
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Filter each chart by date to review past visits, schedules, and patient concerns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <AnalyticsChartPanel
          title="Appointments by status"
          description="Scheduled, completed, cancelled, and in-progress visits"
          data={statusChart}
          chartKind="categorical"
          categoryAxisLabel="Status"
          valueAxisLabel="Appointments"
          valueLabel="appointments"
          isEmpty={!hasValues(statusChart)}
          dateRange={statusRange}
          onDateRangeChange={setStatusRange}
          dateHint="Filtered by visit or booking date."
        />
        <AnalyticsChartPanel
          title="Schedule by time of day"
          description="When visits are scheduled in the selected period"
          data={timeChart}
          chartKind="categorical"
          categoryAxisLabel="Time of day"
          valueAxisLabel="Visits"
          valueLabel="visits"
          isEmpty={!hasValues(timeChart)}
          dateRange={timeRange}
          onDateRangeChange={setTimeRange}
        />
        <AnalyticsChartPanel
          title="Patient illness & concerns"
          description="Share of visits by symptom or diagnosis"
          data={illnessChart}
          chartKind="distribution"
          categoryAxisLabel="Concern"
          valueAxisLabel="Share"
          valueLabel="patients"
          isEmpty={!hasValues(illnessChart)}
          className="lg:col-span-2 xl:col-span-1"
          dateRange={illnessRange}
          onDateRangeChange={setIllnessRange}
        />
      </div>
    </section>
  );
}
