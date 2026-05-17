import {calculateBmi, fetchBmiBuddyInfo, isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { categoryFromBmi, computeBmi } from "@/lib/bmi";
import type { BmiBuddyInfo, BmiBuddyResultsState, BmiCalculateResponse, BmiCategoryDescriptor } from "@/types/bmi";
import { Activity, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Link, useNavigate, useOutletContext } from "react-router-dom";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25";

function formatCategoryLine(cat: BmiCategoryDescriptor): string {
  if (typeof cat === "string") return cat;
  if (cat && typeof cat === "object") {
    const o = cat as Record<string, unknown>;
    const label = o.label ?? o.name ?? o.title;
    if (typeof label === "string") return label;
    const min = o.minBmi ?? o.min;
    const max = o.maxBmi ?? o.max;
    if (min != null && max != null) return `${min} – ${max}`;
    if (min != null) return `From ${min}`;
    if (max != null) return `Up to ${max}`;
  }
  return "";
}

export function BmiBuddySetupPage() {
  const navigate = useNavigate();
  const { user } = useOutletContext<DashboardOutletContext>();
  const serverOk = isServerConfigured();
  const [info, setInfo] = useState<BmiBuddyInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!serverOk) {
      setLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBmiBuddyInfo();
        if (!cancelled) setInfo(data);
      } catch (e) {
        if (!cancelled) setLoadError(userFacingError(e, "Could not load BMI information."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverOk]);

  function validateInputs(): { h: number; w: number } | null {
    setFieldError(null);
    const h = Number.parseFloat(heightCm.replace(",", "."));
    const w = Number.parseFloat(weightKg.replace(",", "."));
    if (!Number.isFinite(h) || h < 50 || h > 250) {
      setFieldError("Enter a realistic height in centimetres (about 50–250).");
      return null;
    }
    if (!Number.isFinite(w) || w < 20 || w > 400) {
      setFieldError("Enter a realistic weight in kilograms (about 20–400).");
      return null;
    }
    return { h, w };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validateInputs();
    if (!v) return;
    setSubmitting(true);
    try {
      if (serverOk) {
        try {
          const result = await calculateBmi(v.h, v.w);
          const state: BmiBuddyResultsState = {
            heightCm: v.h,
            weightKg: v.w,
            result,
            source: "api",
          };
          navigate("/dashboard/bmi-buddy/results", { state, replace: false });
          return;
        } catch {
          /* fall through to offline estimate */
        }
      }
      const bmi = computeBmi(v.h, v.w);
      const { key, label } = categoryFromBmi(bmi);
      const result: BmiCalculateResponse = {
        bmi,
        category: label,
        categoryKey: key,
        note: serverOk
          ? "The calculator could not be reached right now. This estimate is computed on your device from height and weight only — not a substitute for medical advice."
          : "MediHub is unavailable right now, so your BMI is estimated on this device from height and weight only — not a substitute for medical advice.",
        plans: { dietPlan: [], workoutPlan: [], lifestylePlan: [] },
      };
      const state: BmiBuddyResultsState = {
        heightCm: v.h,
        weightKg: v.w,
        result,
        source: "offline",
      };
      navigate("/dashboard/bmi-buddy/results", { state, replace: false });
    } finally {
      setSubmitting(false);
    }
  }

  const paramLabels =
    info?.requiredParameters && info.requiredParameters.length > 0
      ? info.requiredParameters
      : ["heightCm — height in centimetres", "weightKg — weight in kilograms"];

  const showInfoSpinner = serverOk && !loadError && info === null;
  const defaultMeaning =
    "Body Mass Index (BMI) relates weight to height. It is a rough screening measure for adults and does not replace clinical assessment — muscle mass, age, and ethnicity are not captured in the number alone.";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to={dashboardHomePath(user.role)}
        className="mb-6 inline-flex text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        ← Back to dashboard home
      </Link>

      <div className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/90 to-white p-5 shadow-sm">
        <Activity className="mt-0.5 h-8 w-8 shrink-0 text-teal-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">BMI Buddy</h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter the measurements your care programme expects. Next, you will see your category, a simple scale
            indicator, and practical diet, activity, and lifestyle ideas.
          </p>
        </div>
      </div>

      {!serverOk ? (
        <div
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {SERVICE_UNAVAILABLE} You can still get an on-device BMI estimate and general wellness tips below.
        </div>
      ) : null}

      {loadError ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
          {loadError} You can still submit your height and weight; we will fall back to an on-device estimate if needed.
        </div>
      ) : null}

      {showInfoSpinner ? (
        <div className="mt-8 flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-label="Loading BMI information" />
        </div>
      ) : (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">What is BMI?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{info?.meaning?.trim() ? info.meaning : defaultMeaning}</p>
        </section>
      )}

      {info && info.categories.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reference categories</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
            {info.categories.map((c, i) => {
              const line = formatCategoryLine(c);
              return line ? <li key={i}>{line}</li> : null;
            })}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your measurements</h2>
        <p className="mt-1 text-xs text-slate-500">Height and weight are used to calculate your BMI.</p>
        <ul className="mt-2 list-inside list-disc text-xs text-slate-600">
          {paramLabels.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="bmi-height" className="mb-1 block text-sm font-medium text-slate-700">
              Height (cm)
            </label>
            <input
              id="bmi-height"
              inputMode="decimal"
              autoComplete="off"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              disabled={submitting}
              className={inputClass}
              placeholder="e.g. 170"
            />
          </div>
          <div>
            <label htmlFor="bmi-weight" className="mb-1 block text-sm font-medium text-slate-700">
              Weight (kg)
            </label>
            <input
              id="bmi-weight"
              inputMode="decimal"
              autoComplete="off"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              disabled={submitting}
              className={inputClass}
              placeholder="e.g. 72"
            />
          </div>
          {fieldError ? (
            <p className="text-sm text-red-600" role="alert">
              {fieldError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Working…
              </>
            ) : (
              <>
                See my BMI and tips
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
