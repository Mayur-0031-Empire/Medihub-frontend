import { DocumentVitalsIntake } from "@/components/doctor/DocumentVitalsIntake";
import { DoctorConsultPatientReports } from "@/components/doctor/DoctorConsultPatientReports";
import { DoctorFilesUploadSection } from "@/components/doctor/DoctorFilesUploadSection";
import {
  approveAppointmentPrescription,
  generateAppointmentAiDraft,
  updateDoctorAppointmentNotes,
  userFacingError,
} from "@/lib/api";
import { pickDisplayedPrescription } from "@/lib/appointments";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  countFilledVitals,
  mergeNotesWithVitals,
  parseVitalsFromNotes,
  vitalsSummaryForAi,
} from "@/lib/appointments/vitals";
import type { AppointmentDetail } from "@/types/appointment";
import type { PatientVitals } from "@/types/vitals";
import { EMPTY_VITALS } from "@/types/vitals";
import type { ConsultationTranscriptionState } from "@/hooks/useConsultationTranscription";
import { ClipboardList, Loader2, Mic, Sparkles, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/15";

const textareaClass =
  "w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25";

type Props = {
  appointmentId: string;
  appt: AppointmentDetail;
  onApptChange: (detail: AppointmentDetail) => void;
  transcript: string;
  onTranscriptChange: (value: string) => void;
  transcription: Pick<
    ConsultationTranscriptionState,
    "interimLine" | "isListening" | "isSupported" | "error"
  >;
  persistTranscriptWhileLive?: boolean;
  /** When true, patient uploads + AI scan review are shown (live video call only). */
  liveConsult?: boolean;
  onRefreshAppt?: () => void;
  refreshingAppt?: boolean;
};

export function DoctorConsultClinicalPanel({
  appointmentId,
  appt,
  onApptChange,
  transcript,
  onTranscriptChange,
  transcription,
  persistTranscriptWhileLive = false,
  liveConsult = false,
  onRefreshAppt,
  refreshingAppt,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [vitals, setVitals] = useState<PatientVitals>(EMPTY_VITALS);
  const [prescriptionText, setPrescriptionText] = useState("");

  const hydratedId = useRef<string | null>(null);

  const applyAppt = useCallback(
    (detail: AppointmentDetail) => {
      onApptChange(detail);
      setDiagnosis(detail.doctorDiagnosis ?? "");
      const parsed = parseVitalsFromNotes(detail.doctorNotes);
      setVitals(parsed.vitals);
      setClinicalNotes(parsed.clinicalNotes);
      onTranscriptChange(detail.meetingTranscript ?? "");
      setPrescriptionText(pickDisplayedPrescription(detail));
    },
    [onApptChange, onTranscriptChange],
  );

  useEffect(() => {
    if (hydratedId.current === appointmentId) return;
    hydratedId.current = appointmentId;
    setDiagnosis(appt.doctorDiagnosis ?? "");
    const parsed = parseVitalsFromNotes(appt.doctorNotes);
    setVitals(parsed.vitals);
    setClinicalNotes(parsed.clinicalNotes);
    onTranscriptChange(appt.meetingTranscript ?? "");
    setPrescriptionText(pickDisplayedPrescription(appt));
  }, [appointmentId, appt, onTranscriptChange]);

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

  async function saveNotesPayload() {
    const updated = await updateDoctorAppointmentNotes(appointmentId, {
      doctorDiagnosis: diagnosis.trim() || undefined,
      doctorNotes: buildDoctorNotesPayload(),
      meetingTranscript: transcript.trim() || undefined,
    });
    applyAppt(updated);
    setLastAutoSavedAt(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
  }

  async function onSaveNotes(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveNotesPayload();
      notifySuccess("Clinical notes saved.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not save notes."));
    } finally {
      setSaving(false);
    }
  }

  async function onAiDraft() {
    setAiLoading(true);
    try {
      const saved = await updateDoctorAppointmentNotes(appointmentId, {
        doctorDiagnosis: diagnosis.trim() || undefined,
        doctorNotes: buildAiContextNotes() ?? buildDoctorNotesPayload(),
        meetingTranscript: transcript.trim() || undefined,
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

  const transcriptSaveRef = useRef(transcript);
  useEffect(() => {
    transcriptSaveRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (!persistTranscriptWhileLive || !transcript.trim()) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await updateDoctorAppointmentNotes(appointmentId, {
            meetingTranscript: transcriptSaveRef.current.trim() || undefined,
          });
          setLastAutoSavedAt(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
        } catch {
          /* auto-save is best-effort */
        }
      })();
    }, 25_000);
    return () => window.clearTimeout(timer);
  }, [appointmentId, persistTranscriptWhileLive, transcript]);

  const transcriptDisplay =
    transcription.isListening && transcription.interimLine
      ? transcript
        ? `${transcript}\n${transcription.interimLine}`
        : transcription.interimLine
      : transcript;

  return (
    <aside className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-2xl border border-teal-200/80 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-teal-700" aria-hidden />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Consult workflow</h2>
            <p className="text-xs text-slate-500">Notes, transcript & AI prescription</p>
          </div>
        </div>
        <Link
          to={`/dashboard/doctor/appointments/${appointmentId}`}
          className="mt-2 inline-block text-xs font-medium text-teal-700 hover:text-teal-800"
        >
          Open full appointment record →
        </Link>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
              <Mic className="h-3.5 w-3.5" aria-hidden />
              Live transcript
            </h3>
            {transcription.isListening ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" aria-hidden />
                Recording
              </span>
            ) : null}
          </div>
          {!transcription.isSupported ? (
            <p className="mt-2 text-xs text-amber-800">
              Live transcription needs Chrome or Edge. You can still type or paste a transcript below.
            </p>
          ) : (
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Captures speech from your microphone while the call is live. Patient audio may appear if audible on your
              device.
            </p>
          )}
          {transcription.error ? (
            <p className="mt-2 text-xs text-red-700">{transcription.error}</p>
          ) : null}
          <textarea
            className={`${textareaClass} mt-2 font-mono text-xs`}
            rows={6}
            readOnly={transcription.isListening}
            value={transcriptDisplay}
            onChange={(e) => {
              if (!transcription.isListening) onTranscriptChange(e.target.value);
            }}
            placeholder="Transcript will appear here during the call…"
            aria-label="Meeting transcript"
          />
          {lastAutoSavedAt ? (
            <p className="mt-1 text-[10px] text-slate-400">Transcript auto-saved at {lastAutoSavedAt}</p>
          ) : null}
        </section>

        <DoctorConsultPatientReports
          files={appt.patientReports ?? []}
          vitals={vitals}
          onVitalsChange={setVitals}
          disabled={saving || aiLoading}
          liveConsult={liveConsult}
          onRefresh={liveConsult ? onRefreshAppt : undefined}
          refreshing={refreshingAppt}
          clinicalContext={{
            symptoms: appt.symptoms,
            diagnosis: diagnosis || appt.doctorDiagnosis,
            patientNotes: appt.patientNotes,
          }}
        />

        <DocumentVitalsIntake vitals={vitals} onVitalsChange={setVitals} disabled={saving || aiLoading} />

        <DoctorFilesUploadSection
          appointmentId={appointmentId}
          files={appt.doctorFiles ?? []}
          onUpdated={applyAppt}
          compact
          disabled={saving || aiLoading}
        />

        <form onSubmit={(e) => void onSaveNotes(e)} className="space-y-3 rounded-xl border border-slate-200 p-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Stethoscope className="h-4 w-4 text-teal-600" aria-hidden />
            Clinical notes
          </h3>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700">Diagnosis</span>
            <input className={inputClass} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700">Notes</span>
            <textarea
              className={textareaClass}
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Observations during the visit…"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save notes & transcript"}
          </button>
        </form>

        <section className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-violet-600" aria-hidden />
              AI prescription
            </h3>
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => void onAiDraft()}
              className="shrink-0 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-50 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate"}
            </button>
          </div>
          <p className="text-[11px] text-slate-600">
            Uses saved diagnosis, vitals, notes, and the meeting transcript for the draft.
            {countFilledVitals(vitals) === 0 ? " Upload a lab report in vitals for better results." : null}
          </p>
          {appt.prescriptionDraft && !prescriptionText ? (
            <p className="rounded-lg bg-violet-100/80 px-2 py-1.5 text-[11px] text-violet-950">
              <span className="font-semibold">Draft: </span>
              {appt.prescriptionDraft}
            </p>
          ) : null}
          <form onSubmit={(e) => void onApprovePrescription(e)} className="space-y-2">
            <textarea
              className={textareaClass}
              rows={4}
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder="Medication, dosage, instructions…"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Approve prescription
            </button>
          </form>
        </section>
      </div>
    </aside>
  );
}
