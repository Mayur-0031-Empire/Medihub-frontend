import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { VisitDocumentsCard } from "@/components/patient/VisitDocumentsCard";
import { loadPatientMedicalArchive } from "@/lib/appointments/medicalArchive";
import { isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { FileText, FolderOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function PatientVisitDocumentsPage() {
  const serverOk = isServerConfigured();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof loadPatientMedicalArchive>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "with-docs">("all");

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await loadPatientMedicalArchive());
    } catch (e) {
      setError(userFacingError(e, "Could not load your visit documents."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === "with-docs") {
      return entries.filter((e) => e.hasPrescription || e.hasDoctorFiles);
    }
    return entries;
  }, [entries, filter]);

  const withDocsCount = useMemo(
    () => entries.filter((e) => e.hasPrescription || e.hasDoctorFiles).length,
    [entries],
  );

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <p>{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileText className="h-9 w-9 shrink-0 text-primary" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visit documents</h1>
            <p className="mt-1 max-w-xl text-slate-600">
              Prescriptions and files your doctor shared, grouped by appointment. Each visit keeps its own
              prescription and downloads.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/patient/medical-records"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FolderOpen className="h-4 w-4" aria-hidden />
          My uploaded records
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={[
            "rounded-full px-3 py-1.5 text-sm font-medium transition",
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          All visits ({entries.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("with-docs")}
          className={[
            "rounded-full px-3 py-1.5 text-sm font-medium transition",
            filter === "with-docs"
              ? "bg-primary text-primary-foreground"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          With documents ({withDocsCount})
        </button>
      </div>

      {loading ? <PageLoader label="Loading visit documents…" className="mt-12" /> : null}
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={FileText}
          title={filter === "with-docs" ? "No documents yet" : "No visits yet"}
          description={
            filter === "with-docs"
              ? "When your doctor approves a prescription or shares a file, it will appear here for that visit."
              : "Book an appointment first. Documents from your doctor will show up here after your visit."
          }
          actionLabel="Book an appointment"
          actionTo="/dashboard/patient/appointments"
        />
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-6">
          {visible.map((entry) => (
            <li key={entry.appointment._id}>
              <VisitDocumentsCard entry={entry} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
