import { AnalyticsChartPanel } from "@/components/charts/AnalyticsChartPanel";
import {
  appointmentsByDay,
  appointmentsByStatus,
  appointmentsByTimeSlot,
  CHART_COLORS,
  doctorsPerHospitalFromAppointments,
  specialtiesFromAppointments,
} from "@/lib/analytics/appointmentAnalytics";
import { defaultChartDateRange, type ChartDateRange } from "@/lib/analytics/dateRange";
import {
  doctorsPerHospital,
  specialtiesByHospital,
  specialtiesNetworkWide,
} from "@/lib/analytics/networkAnalytics";
import {
  loadNetworkSnapshotOnOrBefore,
  saveNetworkSnapshot,
} from "@/lib/analytics/networkSnapshots";
import { fetchPublicAppointmentsForAnalytics, fetchPublicDoctors, isServerConfigured } from "@/lib/api";
import { SERVICE_UNAVAILABLE, userFacingError } from "@/lib/userMessages";
import type { PatientAppointment } from "@/types/appointment";
import { Activity, Building2, Loader2, RefreshCw, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function hasValues(data: { value: number }[]): boolean {
  return data.some((d) => d.value > 0);
}

function useChartDateState() {
  return useState<ChartDateRange>(defaultChartDateRange);
}

/** Home page care network + platform activity charts with per-chart date filters. */
export function HomeNetworkDashboard() {
  const serverOk = isServerConfigured();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorCount, setDoctorCount] = useState(0);
  const [doctors, setDoctors] = useState<Awaited<ReturnType<typeof fetchPublicDoctors>>>([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);

  const [hospitalRange, setHospitalRange] = useChartDateState();
  const [specialtyHospitalRange, setSpecialtyHospitalRange] = useChartDateState();
  const [specialtyRange, setSpecialtyRange] = useChartDateState();
  const [statusRange, setStatusRange] = useChartDateState();
  const [trendRange, setTrendRange] = useChartDateState();
  const [timeRange, setTimeRange] = useChartDateState();

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setError(null);
    try {
      const [doctorRows, apptRows] = await Promise.all([
        fetchPublicDoctors(),
        fetchPublicAppointmentsForAnalytics(),
      ]);
      setDoctors(doctorRows);
      setDoctorCount(doctorRows.length);
      setAppointments(apptRows);
      saveNetworkSnapshot(doctorRows);
    } catch (e) {
      setDoctorCount(0);
      setDoctors([]);
      setAppointments([]);
      setError(userFacingError(e, "Could not load care network data."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasBookingData = appointments.length > 0;
  const bookingLabel = hasBookingData ? "bookings" : "doctors";

  const hospitalChart = useMemo(() => {
    if (hasBookingData) {
      return {
        data: doctorsPerHospitalFromAppointments(appointments, hospitalRange),
        hint: "Filtered by visit date in the selected period.",
      };
    }
    const snap = loadNetworkSnapshotOnOrBefore(hospitalRange.to);
    if (snap) {
      return {
        data: snap.snapshot.byHospital,
        hint: `Profile snapshot from ${snap.dateKey} (saved when MediHub was visited).`,
      };
    }
    return {
      data: doctorsPerHospital(doctors),
      hint: "Latest doctor profiles. Pick an older date after visiting on that day to see saved snapshots.",
    };
  }, [appointments, doctors, hasBookingData, hospitalRange]);

  const specialtyHospitalChart = useMemo(() => {
    if (hasBookingData) {
      const map = new Map<string, number>();
      for (const a of appointments) {
        if (!a.startAt && !a.createdAt) continue;
        const inRange =
          new Date(a.startAt ?? a.createdAt!).getTime() >= specialtyHospitalRange.from.getTime() &&
          new Date(a.startAt ?? a.createdAt!).getTime() <= specialtyHospitalRange.to.getTime();
        if (!inRange) continue;
        const key = `${a.hospitalName?.trim() || "Hospital not listed"} — ${a.specialization?.trim() || "General practice"}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return {
        data: [...map.entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
          .map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] })),
        hint: "Bookings in the selected period.",
      };
    }
    const snap = loadNetworkSnapshotOnOrBefore(specialtyHospitalRange.to);
    if (snap) {
      return {
        data: snap.snapshot.hospitalSpecialties,
        hint: `Profile snapshot from ${snap.dateKey}.`,
      };
    }
    return {
      data: specialtiesByHospital(doctors),
      hint: "Latest doctor profiles.",
    };
  }, [appointments, doctors, hasBookingData, specialtyHospitalRange]);

  const specialtyChart = useMemo(() => {
    if (hasBookingData) {
      return {
        data: specialtiesFromAppointments(appointments, specialtyRange),
        hint: "Specialties from bookings in the selected period.",
      };
    }
    const snap = loadNetworkSnapshotOnOrBefore(specialtyRange.to);
    if (snap) {
      return {
        data: snap.snapshot.specialties,
        hint: `Profile snapshot from ${snap.dateKey}.`,
      };
    }
    return {
      data: specialtiesNetworkWide(doctors),
      hint: "Latest doctor profiles.",
    };
  }, [appointments, doctors, hasBookingData, specialtyRange]);

  const statusChart = useMemo(
    () => appointmentsByStatus(appointments, statusRange),
    [appointments, statusRange],
  );

  const trendChart = useMemo(
    () => appointmentsByDay(appointments, trendRange),
    [appointments, trendRange],
  );

  const timeChart = useMemo(
    () => appointmentsByTimeSlot(appointments, timeRange).filter((d) => d.value > 0),
    [appointments, timeRange],
  );

  if (!serverOk) {
    return (
      <section className="rounded-3xl border border-amber-200/90 bg-amber-50/50 p-6 sm:p-8 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-sm text-amber-950 dark:text-amber-100">{SERVICE_UNAVAILABLE}</p>
      </section>
    );
  }

  return (
    <section
      id="home-care-network-dashboard"
      className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
      aria-labelledby="home-care-network-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-8 w-8 shrink-0 text-teal-600" aria-hidden />
          <div>
            <h2 id="home-care-network-title" className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              Care network & activity
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
              Explore hospitals, specialties, and platform bookings. Each chart has its own date control to view
              historical data.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-100 disabled:opacity-50 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-100 dark:hover:bg-teal-900/50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          Loading charts…
        </p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && doctorCount > 0 ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/80 px-4 py-3 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          <Stethoscope className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">{doctorCount}</span> verified doctor{doctorCount === 1 ? "" : "s"}
            {hasBookingData ? (
              <>
                {" "}
                · <span className="font-semibold">{appointments.length}</span> booking
                {appointments.length === 1 ? "" : "s"} for analytics
              </>
            ) : (
              " — booking history appears when the platform API allows public access."
            )}
          </span>
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <AnalyticsChartPanel
            title="Doctors per hospital"
            description="Hospitals with the most registered or booked doctors"
            data={hospitalChart.data}
            chartKind="ranking"
            categoryAxisLabel="Hospital"
            valueAxisLabel="Count"
            valueLabel={bookingLabel}
            isEmpty={!hasValues(hospitalChart.data)}
            dateRange={hospitalRange}
            onDateRangeChange={setHospitalRange}
            dateHint={hospitalChart.hint}
          />

          <AnalyticsChartPanel
            title="Specialty at each hospital"
            description="Care areas mapped to facilities"
            data={specialtyHospitalChart.data}
            chartKind="ranking"
            categoryAxisLabel="Hospital · specialty"
            valueAxisLabel="Count"
            valueLabel={bookingLabel}
            isEmpty={!hasValues(specialtyHospitalChart.data)}
            dateRange={specialtyHospitalRange}
            onDateRangeChange={setSpecialtyHospitalRange}
            dateHint={specialtyHospitalChart.hint}
          />

          <AnalyticsChartPanel
            title="Specialties on MediHub"
            description="Network-wide specialty mix"
            data={specialtyChart.data}
            chartKind="distribution"
            categoryAxisLabel="Specialty"
            valueAxisLabel="Share"
            valueLabel={bookingLabel}
            isEmpty={!hasValues(specialtyChart.data)}
            className="lg:col-span-2 xl:col-span-1"
            dateRange={specialtyRange}
            onDateRangeChange={setSpecialtyRange}
            dateHint={specialtyChart.hint}
          />

          <AnalyticsChartPanel
            title="Bookings by status"
            description="Scheduled, completed, cancelled, and in-progress visits"
            data={statusChart}
            chartKind="categorical"
            categoryAxisLabel="Status"
            valueAxisLabel="Bookings"
            valueLabel="bookings"
            isEmpty={!hasValues(statusChart)}
            emptyMessage={
              hasBookingData
                ? "No bookings in this period."
                : "Sign in as admin or enable public booking API to see status charts."
            }
            dateRange={statusRange}
            onDateRangeChange={setStatusRange}
            dateHint="Uses visit / booking dates from platform data."
          />

          <AnalyticsChartPanel
            title="Bookings over time"
            description="Daily visit volume in the selected range"
            data={trendChart}
            chartKind="timeSeries"
            categoryAxisLabel="Day"
            valueAxisLabel="Bookings"
            valueLabel="bookings"
            isEmpty={!hasValues(trendChart)}
            emptyMessage={
              hasBookingData ? "No bookings in this period." : "Booking trend requires platform appointment data."
            }
            dateRange={trendRange}
            onDateRangeChange={setTrendRange}
          />

          <AnalyticsChartPanel
            title="Visits by time of day"
            description="When appointments are scheduled"
            data={timeChart}
            chartKind="categorical"
            categoryAxisLabel="Time of day"
            valueAxisLabel="Visits"
            valueLabel="visits"
            isEmpty={!hasValues(timeChart)}
            emptyMessage={hasBookingData ? "No timed visits in this period." : "Time-of-day chart needs booking data."}
            className="lg:col-span-2 xl:col-span-1"
            dateRange={timeRange}
            onDateRangeChange={setTimeRange}
          />
        </div>
      ) : null}

      {!loading && !error && doctorCount === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          <Activity className="mx-auto mb-2 h-8 w-8 text-slate-400" aria-hidden />
          Charts will appear when verified doctors join the platform with hospital and specialty details.
        </p>
      ) : null}
    </section>
  );
}
