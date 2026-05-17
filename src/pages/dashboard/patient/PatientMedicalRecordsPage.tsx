import { AppointmentFileList } from "@/components/appointments/AppointmentFileList";
import { loadPatientMedicalArchive, type PatientMedicalArchiveEntry } from "@/lib/appointments/medicalArchive";
import { formatAppointmentStatus, formatSlotRange } from "@/lib/appointments";
import { isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { CalendarClock, FileText, FolderOpen, Loader2, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ArchiveCard({ entry }: { entry: PatientMedicalArchiveEntry }) {
  const { appointment: a, detail, reportCount, hasPrescription, hasDoctorFiles, doctorFiles } = entry;
  const shortId = a._id.slice(-8).toUpperCase();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold text-teal-700">Visit {shortId}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{a.doctorName}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
            <Stethoscope className="h-3.5 w-3.5 text-teal-600" aria-hidden />
            {a.specialization} · {a.hospitalName}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            {a.startAt ? formatSlotRange(a.startAt, a.endAt) : "Date TBC"} · {formatAppointmentStatus(a.status)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/dashboard/patient/appointments/${a._id}`}
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100"
          >
            Open visit
          </Link>
          {!a.status.toLowerCase().includes("cancel") ? (
            <Link
              to={`/dashboard/patient/consult/${a._id}`}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Video visit
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Your uploads ({reportCount})</h3>
        <p className="mt-1 text-xs text-slate-500">MRI, lab reports, or scans you added for this visit.</p>
        <div className="mt-2">
          <AppointmentFileList
            files={detail?.patientReports ?? []}
            emptyMessage="No MRI, scans, or reports uploaded for this visit."
          />
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm">
        <FileText className="h-4 w-4 text-primary" aria-hidden />
        <span className="text-slate-700">
          {hasPrescription ? "Prescription on file" : "No prescription yet"}
          {hasDoctorFiles ? ` · ${doctorFiles.length} doctor file${doctorFiles.length === 1 ? "" : "s"}` : ""}
        </span>
        <Link
          to={`/dashboard/patient/documents#visit-${a._id}`}
          className="ml-auto text-xs font-semibold text-teal-700 hover:underline"
        >
          View documents
        </Link>
      </div>
    </article>
  );
}

export function PatientMedicalRecordsPage() {
  const serverOk = isServerConfigured();
  const [entries, setEntries] = useState<PatientMedicalArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await loadPatientMedicalArchive());
    } catch (e) {
      setError(userFacingError(e, "Could not load your medical records."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <p>{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-3">
        <FolderOpen className="h-9 w-9 shrink-0 text-teal-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My medical library</h1>
          <p className="mt-1 text-slate-600">
            Your uploaded MRI, lab, and scan files by visit. For prescriptions and doctor-shared files, see{" "}
            <Link to="/dashboard/patient/documents" className="font-medium text-teal-700 hover:underline">
              Visit documents
            </Link>
            .
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading" />
        </div>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {!loading && !error && entries.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
          No visits yet. After you book and upload records, they will appear here by appointment.
        </p>
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-6">
          {entries.map((entry) => (
            <li key={entry.appointment._id}>
              <ArchiveCard entry={entry} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
