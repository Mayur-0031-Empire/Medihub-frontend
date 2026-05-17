import {
  DEFAULT_DOCTOR_FILTERS,
  type DoctorListFilters,
  type ExperienceFilter,
  type FeeFilter,
} from "@/types/appointment";
import { Filter, RotateCcw } from "lucide-react";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-800 shadow-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-600/15";

const EXPERIENCE_OPTIONS: { value: ExperienceFilter; label: string }[] = [
  { value: "any", label: "Any experience" },
  { value: "0-2", label: "Up to 2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "10+", label: "10+ years" },
];

const FEE_OPTIONS: { value: FeeFilter; label: string }[] = [
  { value: "any", label: "Any fee" },
  { value: "under-500", label: "Under ₹500" },
  { value: "500-1000", label: "₹500 – ₹1,000" },
  { value: "over-1000", label: "Above ₹1,000" },
];

export function DoctorFiltersPanel({
  filters,
  specialities,
  hospitals,
  resultCount,
  onChange,
}: {
  filters: DoctorListFilters;
  specialities: string[];
  hospitals: string[];
  resultCount: number;
  onChange: (next: DoctorListFilters) => void;
}) {
  function patch(partial: Partial<DoctorListFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter className="h-4 w-4 text-teal-600" aria-hidden />
          Filter doctors
        </h2>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_DOCTOR_FILTERS)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {resultCount} doctor{resultCount === 1 ? "" : "s"} shown
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Speciality</span>
          <select
            className={selectClass}
            value={filters.speciality}
            onChange={(e) => patch({ speciality: e.target.value })}
          >
            <option value="">All specialities</option>
            {specialities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hospital</span>
          <select
            className={selectClass}
            value={filters.hospital}
            onChange={(e) => patch({ hospital: e.target.value })}
          >
            <option value="">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</span>
          <select
            className={selectClass}
            value={filters.experience}
            onChange={(e) => patch({ experience: e.target.value as ExperienceFilter })}
          >
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Consultation fee</span>
          <select
            className={selectClass}
            value={filters.fees}
            onChange={(e) => patch({ fees: e.target.value as FeeFilter })}
          >
            {FEE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}
