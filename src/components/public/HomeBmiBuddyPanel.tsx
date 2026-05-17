import { calculateBmi, fetchBmiBuddyInfo, isServerConfigured } from "@/lib/api";
import { categoryFromBmi, computeBmi, mergePlansWithRemedies } from "@/lib/bmi";
import type { BmiCalculateResponse } from "@/types/bmi";
import { Activity, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25";

function categoryChip(categoryKey: string): string {
  switch (categoryKey) {
    case "underweight":
      return "bg-sky-100 text-sky-900";
    case "normal":
      return "bg-emerald-100 text-emerald-900";
    case "overweight":
      return "bg-amber-100 text-amber-950";
    case "obese":
      return "bg-rose-100 text-rose-950";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

/** BMI calculator on the marketing home page — no sign-in. */
export function HomeBmiBuddyPanel() {
  const serverOk = isServerConfigured();
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BmiCalculateResponse | null>(null);
  const [source, setSource] = useState<"api" | "offline" | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);

  useEffect(() => {
    if (!serverOk) return;
    let cancelled = false;
    void (async () => {
      try {
        const info = await fetchBmiBuddyInfo();
        if (!cancelled && info.meaning?.trim()) setMeaning(info.meaning.trim());
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverOk]);

  function validate(): { h: number; w: number } | null {
    setFieldError(null);
    const h = Number.parseFloat(heightCm.replace(",", "."));
    const w = Number.parseFloat(weightKg.replace(",", "."));
    if (!Number.isFinite(h) || h < 50 || h > 250) {
      setFieldError("Enter height in cm (about 50–250).");
      return null;
    }
    if (!Number.isFinite(w) || w < 20 || w > 400) {
      setFieldError("Enter weight in kg (about 20–400).");
      return null;
    }
    return { h, w };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (!v) return;
    setSubmitting(true);
    setResult(null);
    setSource(null);
    try {
      if (serverOk) {
        try {
          const apiResult = await calculateBmi(v.h, v.w);
          setResult(apiResult);
          setSource("api");
          return;
        } catch {
          /* offline fallback */
        }
      }
      const bmi = computeBmi(v.h, v.w);
      const { key, label } = categoryFromBmi(bmi);
      setResult({
        bmi,
        category: label,
        categoryKey: key,
        note: "Estimated on this device. Sign in or try again later for personalized plans when available.",
        plans: { dietPlan: [], workoutPlan: [], lifestylePlan: [] },
      });
      setSource("offline");
    } finally {
      setSubmitting(false);
    }
  }

  const plans = result ? mergePlansWithRemedies(result.categoryKey, result.plans) : null;

  return (
    <section
      id="home-bmi-buddy"
      className="flex h-full flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <Activity className="mt-0.5 h-8 w-8 shrink-0 text-teal-600" aria-hidden />
        <div>
          <h3 className="text-lg font-bold text-slate-900">BMI Buddy</h3>
          <p className="mt-1 text-sm text-slate-600">Check your BMI and get practical wellness tips — no account needed.</p>
        </div>
      </div>

      {meaning ? (
        <p className="mt-4 text-xs leading-relaxed text-slate-500">{meaning}</p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="home-bmi-height" className="mb-1 block text-sm font-medium text-slate-700">
              Height (cm)
            </label>
            <input
              id="home-bmi-height"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              disabled={submitting}
              className={inputClass}
              placeholder="e.g. 170"
            />
          </div>
          <div>
            <label htmlFor="home-bmi-weight" className="mb-1 block text-sm font-medium text-slate-700">
              Weight (kg)
            </label>
            <input
              id="home-bmi-weight"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              disabled={submitting}
              className={inputClass}
              placeholder="e.g. 72"
            />
          </div>
        </div>
        {fieldError ? (
          <p className="text-sm text-red-600" role="alert">
            {fieldError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Calculating…
            </>
          ) : (
            <>
              Calculate BMI
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your result</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <span className="text-4xl font-bold text-slate-900">{result.bmi}</span>
            <span className={`mb-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${categoryChip(result.categoryKey)}`}>
              {result.category}
            </span>
          </div>
          {result.note ? <p className="mt-2 text-sm text-slate-600">{result.note}</p> : null}
          {source === "offline" ? (
            <p className="mt-1 text-xs text-amber-800">On-device estimate — server plans unavailable right now.</p>
          ) : null}
          {plans && (plans.dietPlan.length > 0 || plans.workoutPlan.length > 0) ? (
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
              {[...plans.dietPlan.slice(0, 2), ...plans.workoutPlan.slice(0, 1)].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
