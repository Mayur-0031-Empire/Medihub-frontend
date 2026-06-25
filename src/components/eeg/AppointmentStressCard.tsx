import { fetchAppointmentEegStress, type EegStressPayload, type StressLevel } from "@/lib/api";
import { userFacingError } from "@/lib/userMessages";
import { Activity, Brain, Loader2, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function stressColor(level?: StressLevel): string {
  if (level === "High") return "bg-red-500";
  if (level === "Medium") return "bg-amber-400";
  return "bg-teal-500";
}

function stressPercent(payload: EegStressPayload | null): number {
  const prediction = payload?.prediction;
  if (!prediction) return 0;
  if (typeof prediction.score === "number") return Math.max(0, Math.min(100, prediction.score));
  const base = prediction.stressLevel === "High" ? 82 : prediction.stressLevel === "Medium" ? 55 : 24;
  return Math.round(base * Math.max(0.35, Math.min(1, prediction.confidence || 0.7)));
}

function pointsFor(samples: number[]): string {
  const visible = samples.slice(-80);
  if (visible.length === 0) return "";
  const maxAbs = Math.max(20, ...visible.map((value) => Math.abs(value)));
  return visible
    .map((value, index) => {
      const x = (index / Math.max(1, visible.length - 1)) * 240;
      const y = 46 - (value / maxAbs) * 34;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function AppointmentStressCard({ appointmentId, live }: { appointmentId: string; live?: boolean }) {
  const [payload, setPayload] = useState<EegStressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchAppointmentEegStress(appointmentId);
        if (cancelled) return;
        setPayload(data);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(userFacingError(err, "Could not load EEG stress."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const id = window.setInterval(() => void load(), live ? 2500 : 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [appointmentId, live]);

  const percent = stressPercent(payload);
  const points = useMemo(() => pointsFor(payload?.samples ?? []), [payload?.samples]);
  const prediction = payload?.prediction;

  return (
    <section className="rounded-xl border border-teal-200 bg-teal-50/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
          <Brain className="h-3.5 w-3.5 text-teal-700" aria-hidden />
          Patient stress
        </h3>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" aria-hidden /> : null}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <p className="text-2xl font-bold text-slate-900">{prediction?.stressLevel ?? "Waiting"}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">
            {prediction ? `${prediction.label} · ${Math.round(prediction.confidence * 100)}%` : "No EEG stream yet"}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
          <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          {percent}%
        </div>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
        <div className={`h-full ${stressColor(prediction?.stressLevel)} transition-all duration-300`} style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-3 rounded-lg bg-slate-950 p-2">
        <svg viewBox="0 0 240 92" className="h-20 w-full">
          <line x1="0" x2="240" y1="46" y2="46" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
          <polyline points={points} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-snug text-slate-600">
        <Activity className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden />
        {payload?.metadata?.receivedAt
          ? `Updated ${new Date(payload.metadata.receivedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
          : "Ask the patient to open Stress monitor and connect headset."}
      </p>
      {error ? <p className="mt-2 text-[11px] text-red-700">{error}</p> : null}
    </section>
  );
}
