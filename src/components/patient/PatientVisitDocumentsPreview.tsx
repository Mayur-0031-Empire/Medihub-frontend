import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPatientMedicalArchive } from "@/lib/appointments/medicalArchive";
import { formatSlotRange } from "@/lib/appointments";
import { isServerConfigured } from "@/lib/api";
import { FileDown, FileText, Loader2, Pill } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function PatientVisitDocumentsPreview() {
  const serverOk = isServerConfigured();
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<
    { id: string; doctorName: string; when: string; hasRx: boolean; fileCount: number }[]
  >([]);

  useEffect(() => {
    if (!serverOk) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const entries = await loadPatientMedicalArchive();
        if (cancelled) return;
        const withDocs = entries.filter((e) => e.hasPrescription || e.hasDoctorFiles).slice(0, 3);
        setRecent(
          withDocs.map((e) => ({
            id: e.appointment._id,
            doctorName: e.appointment.doctorName,
            when: e.appointment.startAt
              ? formatSlotRange(e.appointment.startAt, e.appointment.endAt)
              : "Date TBC",
            hasRx: e.hasPrescription,
            fileCount: e.doctorFiles.length,
          })),
        );
      } catch {
        if (!cancelled) setRecent([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverOk]);

  if (!serverOk) return null;

  return (
    <Card className="mt-8 border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            Recent visit documents
          </CardTitle>
          <CardDescription>Prescriptions and files from your doctor, per appointment.</CardDescription>
        </div>
        <Link
          to="/dashboard/patient/documents"
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
            Loading documents…
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No prescriptions or doctor files yet. They will appear here after your visits.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link
                    to={`/dashboard/patient/documents#visit-${row.id}`}
                    className="font-medium text-slate-900 hover:text-primary"
                  >
                    {row.doctorName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.when}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  {row.hasRx ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-violet-900">
                      <Pill className="h-3 w-3" aria-hidden />
                      Rx
                    </span>
                  ) : null}
                  {row.fileCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-teal-900">
                      <FileDown className="h-3 w-3" aria-hidden />
                      {row.fileCount}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
