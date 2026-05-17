import { DocumentVitalsIntake } from "@/components/doctor/DocumentVitalsIntake";
import { DoctorFilesUploadSection } from "@/components/doctor/DoctorFilesUploadSection";
import {
  approveAppointmentPrescription,
  cancelAppointmentByDoctor,
  restoreAppointmentByDoctor,
  fetchAppointmentById,
  generateAppointmentAiDraft,
  isServerConfigured,
  updateDoctorAppointmentNotes,
  userFacingError,
} from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import {
  formatAppointmentStatus,
  formatSlotRange,
  patientDisplayName,
  pickDisplayedPrescription,
} from "@/lib/appointments";
import {
  countFilledVitals,
  mergeNotesWithVitals,
  parseVitalsFromNotes,
  vitalsSummaryForAi,
} from "@/lib/appointments/vitals";
import type { PatientVitals } from "@/types/vitals";
import { EMPTY_VITALS } from "@/types/vitals";
import { notifyError, notifySuccess } from "@/lib/notify";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { AppointmentDetail } from "@/types/appointment";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Stethoscope,
  ArchiveRestore,
  Trash2,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/15";

const textareaClass =
  "w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25";

export function DoctorAppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const serverOk = isServerConfigured();

  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [vitals, setVitals] = useState<PatientVitals>(EMPTY_VITALS);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const applyAppt = useCallback((detail: AppointmentDetail) => {
    setAppt(detail);
    setDiagnosis(detail.doctorDiagnosis ?? "");
    const parsed = parseVitalsFromNotes(detail.doctorNotes);
    setVitals(parsed.vitals);
    setClinicalNotes(parsed.clinicalNotes);
    setTranscript(detail.meetingTranscript ?? "");
    setStatus(detail.status ?? "");
    setPrescriptionText(pickDisplayedPrescription(detail));
  }, []);

  const load = useCallback(async () => {
    if (!serverOk || !appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      applyAppt(await fetchAppointmentById(appointmentId));
    } catch (e) {
      setError(userFacingError(e, "Could not load appointment."));
    } finally {
      setLoading(false);
    }
  }, [appointmentId, applyAppt, serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildDoctorNotesPayload(): string | undefined {
    const merged = mergeNotesWithVitals(clinicalNotes.trim(), vitals);
    return merged || undefined;
  }

  function buildAiContextNotes(): string | undefined {
    const base = buildDoctorNotesPayload();
    const summary = vitalsSummaryForAi(vitals);
    if (!summary) return base;
    const block = `--- Clinical vitals ---\n${summary}`;
    return base ? `${base}\n\n${block}` : block;
  }

  async function onSaveNotes(e: FormEvent) {
    e.preventDefault();
    if (!appointmentId) return;
    setSaving(true);
    try {
      applyAppt(
        await updateDoctorAppointmentNotes(appointmentId, {
          doctorDiagnosis: diagnosis.trim() || undefined,
          doctorNotes: buildDoctorNotesPayload(),
          meetingTranscript: transcript.trim() || undefined,
          status: status.trim() || undefined,
        }),
      );
      notifySuccess("Clinical notes saved.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not save notes."));
    } finally {
      setSaving(false);
    }
  }

  async function onAiDraft() {
    if (!appointmentId) return;
    setAiLoading(true);
    try {
      const saved = await updateDoctorAppointmentNotes(appointmentId, {
        doctorDiagnosis: diagnosis.trim() || undefined,
        doctorNotes: buildAiContextNotes() ?? buildDoctorNotesPayload(),
        meetingTranscript: transcript.trim() || undefined,
        status: status.trim() || undefined,
      });
      applyAppt(saved);
      const updated = await generateAppointmentAiDraft(appointmentId);
      applyAppt(updated);
      const rx = pickDisplayedPrescription(updated);
      if (rx) {
        setPrescriptionText(rx);
        notifySuccess("AI prescription draft ready.");
      } else {
        notifyError(
          "AI request succeeded but no prescription text was returned. Save notes and try again, or enter the prescription manually.",
        );
      }
    } catch (err) {
      notifyError(userFacingError(err, "AI draft failed."));
    } finally {
      setAiLoading(false);
    }
  }

  async function onApprovePrescription(e: FormEvent) {
    e.preventDefault();
    if (!appointmentId) return;
    if (!prescriptionText.trim()) {
      notifyError("Enter prescription text to approve.");
      return;
    }
    setSaving(true);
    try {
      applyAppt(await approveAppointmentPrescription(appointmentId, prescriptionText.trim()));
      notifySuccess("Prescription approved.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not approve prescription."));
    } finally {
      setSaving(false);
    }
  }

  async function onCancel() {
    if (!appointmentId) return;
    if (!window.confirm("Cancel this appointment? The patient will be notified.")) return;
    setSaving(true);
    try {
      applyAppt(await cancelAppointmentByDoctor(appointmentId, cancelReason));
      notifySuccess("Appointment cancelled.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not cancel."));
    } finally {
      setSaving(false);
    }
  }

  async function onRestore() {
    if (!appointmentId) return;
    if (!window.confirm("Restore this visit to your schedule? The patient can attend again.")) return;
    setSaving(true);
    try {
      applyAppt(await restoreAppointmentByDoctor(appointmentId));
      notifySuccess("Appointment restored.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not restore appointment."));
    } finally {
      setSaving(false);
    }
  }

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <p>{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading" />
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard/doctor/appointments" className="text-sm font-medium text-teal-700">
          Back to appointments
        </Link>
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Appointment not found."}
        </p>
      </div>
    );
  }

  const cancelled = appt.status.toLowerCase().includes("cancel");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/dashboard/doctor/appointments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All appointments
      </Link>

      <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Patient visit</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{patientDisplayName(appt)}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {appt.startAt ? formatSlotRange(appt.startAt, appt.endAt) : "Time TBC"} ·{" "}
              {formatAppointmentStatus(appt.status)}
            </p>
          </div>
          {!cancelled ? (
            <Link
              to={`/dashboard/doctor/consult/${appt._id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              <Video className="h-4 w-4" aria-hidden />
              Video consult
            </Link>
          ) : null}
        </div>
        <ul className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          {appt.patientEmail ? (
            <li className="flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-slate-400" />
              {appt.patientEmail}
            </li>
          ) : null}
          {appt.patientPhone ? (
            <li className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-slate-400" />
              {appt.patientPhone}
            </li>
          ) : null}
        </ul>
        {appt.symptoms ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Patient symptoms: </span>
            {appt.symptoms}
          </p>
        ) : null}
        {appt.patientNotes ? (
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Patient notes: </span>
            {appt.patientNotes}
          </p>
        ) : null}
      </header>

      {appt.patientReports && appt.patientReports.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Patient reports</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {appt.patientReports.map((f, i) => {
              const href = resolveMediaUrl(f.url);
              return (
                <li key={i}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                      {f.title ?? f.name ?? "Report"}
                    </a>
                  ) : (
                    <span>{f.title ?? "Report"}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!cancelled ? (
        <>
          <div className="mt-6">
            <DocumentVitalsIntake vitals={vitals} onVitalsChange={setVitals} disabled={saving || aiLoading} />
          </div>

          <form onSubmit={(e) => void onSaveNotes(e)} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Stethoscope className="h-5 w-5 text-teal-600" aria-hidden />
              Consultation notes
            </h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-800">Diagnosis</span>
              <input className={inputClass} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-800">Clinical notes</span>
              <textarea
                className={textareaClass}
                rows={4}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Additional observations beyond extracted vitals…"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-800">Meeting transcript (optional)</span>
              <textarea className={textareaClass} rows={3} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-800">Status</span>
              <input
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="e.g. scheduled, completed"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save notes
            </button>
          </form>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Sparkles className="h-5 w-5 text-violet-600" aria-hidden />
                AI draft & prescription
              </h2>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => void onAiDraft()}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generate AI prescription
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Saves your notes and vitals first, then requests an AI prescription draft from the server.
              {countFilledVitals(vitals) === 0 ? " Upload a lab report above for better results." : null}
            </p>
            {appt.prescriptionDraft && !prescriptionText ? (
              <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-950">
                <span className="font-semibold">Draft: </span>
                {appt.prescriptionDraft}
              </p>
            ) : null}
            <form onSubmit={(e) => void onApprovePrescription(e)} className="mt-4 space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-800">Prescription (approve final text)</span>
                <textarea
                  className={textareaClass}
                  rows={5}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  placeholder="Medication, dosage, and instructions…"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              >
                Approve prescription
              </button>
            </form>
          </section>

          <div className="mt-6">
            <DoctorFilesUploadSection
              appointmentId={appointmentId!}
              files={appt.doctorFiles ?? []}
              onUpdated={applyAppt}
              disabled={saving || aiLoading}
            />
          </div>

          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-5">
            <h2 className="font-semibold text-red-900">Cancel visit</h2>
            <p className="mt-1 text-sm text-red-800/90">The patient will be notified.</p>
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-red-900">Reason (optional)</span>
              <input className={inputClass} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onCancel()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Cancel appointment
            </button>
          </section>
        </>
      ) : (
        <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/40 p-5">
          <h2 className="font-semibold text-slate-900">Cancelled visit</h2>
          <p className="mt-1 text-sm text-slate-600">
            {appt.cancelReason ? `Reason: ${appt.cancelReason}` : "This appointment was cancelled."} You can add it
            back to your schedule.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onRestore()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />}
            Restore appointment
          </button>
        </section>
      )}
    </div>
  );
}
