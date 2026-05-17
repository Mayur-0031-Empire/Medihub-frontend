import { AnalyticsChartPanel } from "@/components/charts/AnalyticsChartPanel";
import {
  hospitalsByDistanceBucket,
  hospitalsOpenStatus,
  topHospitalsByProximity,
} from "@/lib/analytics/hospitalAnalytics";
import type { NearbyHospital } from "@/types/hospital";
import { Building2, Loader2, LocateFixed } from "lucide-react";

type HospitalAnalyticsDashboardProps = {
  hospitals: NearbyHospital[];
  rangeKm: number;
  loading?: boolean;
  hasSearched?: boolean;
  serverOk?: boolean;
  error?: string | null;
  onRequestLocation?: () => void;
};

export function HospitalAnalyticsDashboard({
  hospitals,
  rangeKm,
  loading = false,
  hasSearched = false,
  serverOk = true,
  error = null,
  onRequestLocation,
}: HospitalAnalyticsDashboardProps) {
  const distanceData = hospitalsByDistanceBucket(hospitals);
  const openData = hospitalsOpenStatus(hospitals);
  const proximityData = topHospitalsByProximity(hospitals);
  const hasChartData = hospitals.length > 0;

  return (
    <section
      id="home-hospital-dashboard"
      className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
      aria-labelledby="home-hospital-dashboard-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-8 w-8 shrink-0 text-teal-600" aria-hidden />
          <div>
            <h2 id="home-hospital-dashboard-title" className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              Hospital area dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Charts for hospitals within <span className="font-semibold text-teal-800 dark:text-teal-300">{rangeKm} km</span> of you.
            </p>
          </div>
        </div>
        {hasChartData ? (
          <p className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
            {hospitals.length} hospital{hospitals.length === 1 ? "" : "s"} found
          </p>
        ) : null}
      </div>

      {!serverOk ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Hospital charts need the MediHub API. Configure the server URL to load live data.
        </p>
      ) : loading && !hasSearched ? (
        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          Loading hospital insights for your area…
        </p>
      ) : !hasChartData ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
          {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {hasSearched
              ? "No hospitals in range to chart yet. Try updating your location or widening your search."
              : "Allow location access to see hospital charts for your area."}
          </p>
          {onRequestLocation ? (
            <button
              type="button"
              onClick={onRequestLocation}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Use my location
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnalyticsChartPanel
            title="Hospitals by distance"
            description="How many facilities fall in each distance band"
            data={distanceData}
            chartKind="categorical"
            categoryAxisLabel="Distance band"
            valueAxisLabel="Hospitals"
            valueLabel="hospitals"
          />
          <AnalyticsChartPanel
            title="Open vs closed"
            description="Share of hospitals by hours status"
            data={openData}
            chartKind="distribution"
            categoryAxisLabel="Status"
            valueAxisLabel="Share"
            valueLabel="hospitals"
            isEmpty={openData.length === 0}
          />
          <AnalyticsChartPanel
            title="Nearest hospitals"
            description="Closest facilities by distance"
            data={proximityData}
            chartKind="ranking"
            categoryAxisLabel="Hospital"
            valueAxisLabel="Distance (km)"
            valueLabel="km"
            isEmpty={proximityData.length === 0}
            className="md:col-span-2 lg:col-span-1"
          />
        </div>
      )}
    </section>
  );
}
