import { pickPatientPrescription } from "@/lib/appointments";
import type { AppointmentDetail } from "@/types/appointment";
import { Loader2, Pill, RefreshCw } from "lucide-react";

type Props = {
  appt: AppointmentDetail;
  syncing?: boolean;
  onRefresh?: () => void;
};

export function PatientConsultPrescriptionCard({ appt, syncing, onRefresh }: Props) {
  const prescription = pickPatientPrescription(appt);
  const isApproved = Boolean(appt.approvedPrescription?.trim() || appt.prescriptionText?.trim());

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/80 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Pill className="h-4 w-4 text-violet-600" aria-hidden />
          Your prescription
        </h2>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={syncing}
            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[10px] font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-50"
            aria-label="Refresh prescription"
          >
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-slate-600">Updates automatically when your doctor approves a prescription.</p>

      {prescription ? (
        <div className="mt-3 rounded-xl border border-violet-100 bg-white p-3">
          <p
            className={[
              "mb-2 text-[10px] font-semibold uppercase tracking-wide",
              isApproved ? "text-emerald-700" : "text-violet-700",
            ].join(" ")}
          >
            {isApproved ? "Approved prescription" : "Draft — not final yet"}
          </p>
          <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
            {prescription}
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600">
          No prescription yet. Your doctor will add one during or after this visit.
        </p>
      )}

      {appt.doctorDiagnosis ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Diagnosis: </span>
          {appt.doctorDiagnosis}
        </p>
      ) : null}
    </section>
  );
}
