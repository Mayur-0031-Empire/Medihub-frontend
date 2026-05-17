import { dashboardHomePath } from "@/lib/dashboardPaths";
import { mergePlansWithRemedies } from "@/lib/bmi";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";
import type { BmiBuddyResultsState } from "@/types/bmi";
import { Apple, CircleAlert, Dumbbell, HeartPulse, Leaf } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link, Navigate, useLocation, useOutletContext } from "react-router-dom";

function categoryStyle(categoryKey: string): { chip: string; track: string } {
  switch (categoryKey) {
    case "underweight":
      return {
        chip: "bg-sky-100 text-sky-900 ring-sky-200/80",
        track: "from-sky-300 via-emerald-200 to-emerald-400",
      };
    case "normal":
      return {
        chip: "bg-emerald-100 text-emerald-900 ring-emerald-200/80",
        track: "from-sky-200 via-emerald-400 to-teal-500",
      };
    case "overweight":
      return {
        chip: "bg-amber-100 text-amber-950 ring-amber-200/80",
        track: "from-emerald-300 via-amber-400 to-orange-500",
      };
    case "obese":
      return {
        chip: "bg-rose-100 text-rose-950 ring-rose-200/80",
        track: "from-amber-400 via-rose-500 to-rose-700",
      };
    default:
      return {
        chip: "bg-slate-100 text-slate-800 ring-slate-200/80",
        track: "from-slate-300 via-slate-400 to-slate-500",
      };
  }
}

/** Map BMI on [minBmi, maxBmi] to horizontal position % for the track (linear). */
function bmiToTrackPercent(bmi: number, minBmi = 15, maxBmi = 40): number {
  if (maxBmi <= minBmi) return 50;
  const clamped = Math.min(maxBmi, Math.max(minBmi, bmi));
  return ((clamped - minBmi) / (maxBmi - minBmi)) * 100;
}

const SCALE_TICKS = [15, 18.5, 25, 30, 40] as const;

function tickLabelStyle(value: number): CSSProperties {
  const pct = bmiToTrackPercent(value);
  if (value <= 15.01) {
    return { left: "0%", transform: "translateX(0)" };
  }
  if (value >= 39.99) {
    return { left: "100%", transform: "translateX(-100%)" };
  }
  return { left: `${pct}%`, transform: "translateX(-50%)" };
}

export function BmiBuddyResultsPage() {
  const location = useLocation();
  const { user } = useOutletContext<DashboardOutletContext>();
  const state = location.state as BmiBuddyResultsState | undefined;

  if (!state?.result || typeof state.result.bmi !== "number") {
    return <Navigate to="/dashboard/bmi-buddy" replace />;
  }

  const { heightCm, weightKg, result, source } = state;
  const bmi = Number(result.bmi);
  const plans = mergePlansWithRemedies(result.categoryKey, result.plans);
  const accent = categoryStyle(result.categoryKey);
  const markerPct = bmiToTrackPercent(Number.isFinite(bmi) ? bmi : 22);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap gap-4">
        <Link to="/dashboard/bmi-buddy" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          ← Adjust measurements
        </Link>
        <Link to={dashboardHomePath(user.role)} className="text-sm font-medium text-slate-600 hover:text-slate-800">
          Dashboard home
        </Link>
      </div>

      {source === "offline" ? (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          On-device estimate — connect MediHub for live calculator and plans when available.
        </p>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/5">
        <div className="bg-gradient-to-br from-teal-50 via-white to-slate-50 px-6 pb-8 pt-8 sm:px-10">
          <div className="rounded-2xl border border-white/60 bg-white/95 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your BMI</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">{result.bmi}</span>
              <span
                className={`mb-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${accent.chip}`}
              >
                {result.category}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Height {heightCm} cm · Weight {weightKg} kg
            </p>

            <div className="mt-8 w-full px-1 sm:px-2">
              <p className="mb-2 text-xs font-medium text-slate-500">Adult screening scale (BMI 15–40)</p>
              <div
                className={`relative h-3 w-full overflow-visible rounded-full bg-gradient-to-r ${accent.track}`}
                role="group"
                aria-label={`BMI scale from 15 to 40, your value ${Number.isFinite(bmi) ? bmi : result.bmi}`}
              >
                {SCALE_TICKS.filter((v) => v > 15 && v < 40).map((v) => (
                  <div
                    key={v}
                    className="pointer-events-none absolute top-0 z-[1] h-full w-px bg-white/55"
                    style={{ left: `${bmiToTrackPercent(v)}%`, transform: "translateX(-50%)" }}
                  />
                ))}
                <div
                  className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${markerPct}%` }}
                >
                  <div
                    className="h-7 w-1 rounded-full border-2 border-white bg-slate-900 shadow-md"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="relative mt-1.5 h-5 w-full">
                {SCALE_TICKS.map((v) => (
                  <span
                    key={v}
                    className="absolute top-0 whitespace-nowrap text-[10px] font-semibold tabular-nums text-slate-600"
                    style={tickLabelStyle(v)}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {result.note ? (
              <p className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700">
                {result.note}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 border-t border-slate-100 bg-slate-50/50 p-6 sm:grid-cols-3 sm:p-8">
          <PlanCard
            title="Diet ideas"
            icon={<Apple className="h-5 w-5 text-teal-600" aria-hidden />}
            items={plans.dietPlan}
          />
          <PlanCard
            title="Activity"
            icon={<Dumbbell className="h-5 w-5 text-teal-600" aria-hidden />}
            items={plans.workoutPlan}
          />
          <PlanCard
            title="Lifestyle"
            icon={<Leaf className="h-5 w-5 text-teal-600" aria-hidden />}
            items={plans.lifestylePlan}
          />
        </div>

        <div className="border-t border-slate-100 bg-white px-6 py-4 sm:px-8">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
            <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
            BMI and these suggestions are general wellness information. They do not replace advice from a qualified
            clinician, especially if you are pregnant, an athlete with high muscle mass, or managing a chronic illness.
          </p>
        </div>
      </section>
    </div>
  );
}

function PlanCard({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600">
        {items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
