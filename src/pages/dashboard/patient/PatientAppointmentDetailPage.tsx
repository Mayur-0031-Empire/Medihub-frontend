import { AppointmentFileList } from "@/components/appointments/AppointmentFileList";
import { PatientDoctorFilesSection } from "@/components/appointments/PatientDoctorFilesSection";
import { DoctorAvatar } from "@/components/appointments/DoctorAvatar";
import {
  fetchAppointmentById,
  isServerConfigured,
  updatePatientAppointmentSymptoms,
  uploadPatientAppointmentReports,
  userFacingError,
} from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import {
  formatAppointmentStatus,
  formatSlotRange,
  pickPatientPrescription,
} from "@/lib/appointments";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { AppointmentDetail, PublicDoctorProfile } from "@/types/appointment";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  FileUp,
  Loader2,
  Pill,
  Stethoscope,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

const textareaClass =
  "w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25";

function doctorPreview(appt: AppointmentDetail): PublicDoctorProfile {
  return {
    _id: appt.doctorProfileId ?? "doctor",
    specialization: appt.specialization,
    experienceYears: 0,
    hospitalName: appt.hospitalName,
    consultationFee: appt.consultationFee ?? 0,
    user: {
      firstName: appt.doctorName.split(" ")[0],
      lastName: appt.doctorName.split(" ").slice(1).join(" ") || undefined,
      photo: appt.doctorPhoto,
    },
  };
}

export function PatientAppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const serverOk = isServerConfigured();

  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [patientNotes, setPatientNotes] = useState("");

  const prescription = useMemo(() => (appt ? pickPatientPrescription(appt) : ""), [appt]);
  const cancelled = appt?.status.toLowerCase().includes("cancel") ?? false;

  const load = useCallback(async () => {
    if (!serverOk || !appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAppointmentById(appointmentId);
      setAppt(detail);
      setSymptoms(detail.symptoms ?? "");
      setPatientNotes(detail.patientNotes ?? "");
    } catch (e) {
      setError(userFacingError(e, "Could not load appointment."));
    } finally {
      setLoading(false);
    }
  }, [appointmentId, serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUploadRecords(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!appointmentId) return;
    const form = e.currentTarget;
    const input = form.elements.namedItem("patientReports") as HTMLInputElement;
    const files = input.files ? [...input.files] : [];
    if (files.length === 0) {
      notifyError("Choose at least one file (PDF, image, or document).");
      return;
    }
    setUploading(true);
    try {
      const updated = await uploadPatientAppointmentReports(appointmentId, files);
      setAppt(updated);
      notifySuccess(
        `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}. Your doctor can view them on this visit.`,
      );
      form.reset();
    } catch (err) {
      notifyError(userFacingError(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  }

  async function onSaveVisitDetails(e: FormEvent) {
    e.preventDefault();
    if (!appointmentId) return;
    setSavingDetails(true);
    try {
      const updated = await updatePatientAppointmentSymptoms(appointmentId, {
        symptoms: symptoms.trim() || undefined,
        patientNotes: patientNotes.trim() || undefined,
      });
      setAppt(updated);
      setSymptoms(updated.symptoms ?? "");
      setPatientNotes(updated.patientNotes ?? "");
      notifySuccess("Visit details saved.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not save details."));
    } finally {
      setSavingDetails(false);
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
        <Link to="/dashboard/patient/appointments" className="text-sm font-medium text-teal-700">
          Back to appointments
        </Link>
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Appointment not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/dashboard/patient/appointments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        My appointments
      </Link>

      <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <DoctorAvatar doctor={doctorPreview(appt)} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Your visit</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{appt.doctorName}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-teal-700">
              <Stethoscope className="h-4 w-4" aria-hidden />
              {appt.specialization}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
              <Building2 className="h-4 w-4 text-slate-400" aria-hidden />
              {appt.hospitalName}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden />
              {appt.startAt ? formatSlotRange(appt.startAt, appt.endAt) : "Time to be confirmed"} ·{" "}
              {formatAppointmentStatus(appt.status)}
            </p>
          </div>
        </div>
        {!cancelled ? (
          <Link
            to={`/dashboard/patient/consult/${appt._id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Video className="h-4 w-4" aria-hidden />
            Join video visit
          </Link>
        ) : null}
      </header>

      <section className="mt-6 rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/80 to-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Pill className="h-5 w-5 text-violet-600" aria-hidden />
          Prescription from your doctor
        </h2>
        {prescription ? (
          <div className="mt-4 rounded-xl border border-violet-100 bg-white p-4">
            {appt.approvedPrescription ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Approved prescription
              </p>
            ) : (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">Draft / in review</p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{prescription}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No prescription yet. After your visit, your doctor will add one here for you to view and download.
          </p>
        )}
        {appt.doctorDiagnosis ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Diagnosis: </span>
            {appt.doctorDiagnosis}
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-teal-200 bg-gradient-to-b from-teal-50/80 to-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <FileUp className="h-5 w-5 text-teal-600" aria-hidden />
          Medical records for your doctor
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload lab reports, prescriptions, or past records. Your doctor sees these on this appointment before and
          during the visit.
        </p>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-800">Uploaded records</h3>
          <div className="mt-2">
            <AppointmentFileList
              files={appt.patientReports ?? []}
              emptyMessage="No records uploaded yet. Add files below so your doctor can review them."
            />
          </div>
        </div>

        {!cancelled ? (
          <form onSubmit={(e) => void onUploadRecords(e)} className="mt-5 border-t border-teal-100 pt-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-300/80 bg-white/80 px-4 py-6 text-center">
              <input
                type="file"
                name="patientReports"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,image/*,application/pdf"
                className="sr-only"
                disabled={uploading}
              />
              <FileUp className="h-7 w-7 text-teal-600" aria-hidden />
              <span className="mt-2 text-sm font-semibold text-teal-900">Choose files to upload</span>
              <span className="mt-1 text-xs text-slate-500">PDF, images, or text documents</span>
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Upload medical records
            </button>
          </form>
        ) : null}
      </section>

      <div className="mt-6">
        <PatientDoctorFilesSection files={appt.doctorFiles ?? []} />
      </div>

      {!cancelled ? (
        <form onSubmit={(e) => void onSaveVisitDetails(e)} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Visit details</h2>
          <p className="text-sm text-slate-600">Update symptoms or notes for your doctor.</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-800">Symptoms</span>
            <textarea className={textareaClass} rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-800">Notes for doctor</span>
            <textarea
              className={textareaClass}
              rows={2}
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="Allergies, medications, history…"
            />
          </label>
          <button
            type="submit"
            disabled={savingDetails}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {savingDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save visit details
          </button>
        </form>
      ) : null}
    </div>
  );
}
