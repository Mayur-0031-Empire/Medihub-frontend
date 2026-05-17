import { AppointmentFileList } from "@/components/appointments/AppointmentFileList";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientMedicalArchiveEntry } from "@/lib/appointments/medicalArchive";
import { formatAppointmentStatus, formatSlotRange } from "@/lib/appointments";
import { CalendarClock, FileDown, Pill, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  entry: PatientMedicalArchiveEntry;
  compact?: boolean;
};

export function VisitDocumentsCard({ entry, compact }: Props) {
  const { appointment: a, prescription, doctorFiles, hasPrescription, hasDoctorFiles } = entry;
  const shortId = a._id.slice(-8).toUpperCase();
  const visitPath = `/dashboard/patient/appointments/${a._id}`;

  return (
    <Card id={`visit-${a._id}`} className="scroll-mt-24 border-slate-200 shadow-sm">
      <CardHeader className={compact ? "pb-3" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardDescription className="font-mono text-xs font-semibold text-primary">
              Visit {shortId}
            </CardDescription>
            <CardTitle className="mt-1 text-lg text-slate-900">{a.doctorName}</CardTitle>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {a.specialization} · {a.hospitalName}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {a.startAt ? formatSlotRange(a.startAt, a.endAt) : "Date TBC"} ·{" "}
              {formatAppointmentStatus(a.status)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasPrescription ? (
              <Badge variant="secondary" className="bg-violet-100 text-violet-900">
                <Pill className="mr-1 h-3 w-3" aria-hidden />
                Prescription
              </Badge>
            ) : null}
            {hasDoctorFiles ? (
              <Badge variant="secondary" className="bg-teal-100 text-teal-900">
                <FileDown className="mr-1 h-3 w-3" aria-hidden />
                {doctorFiles.length} file{doctorFiles.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
            <Link
              to={visitPath}
              className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100"
            >
              Open visit
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <section className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Pill className="h-4 w-4 text-violet-600" aria-hidden />
            Prescription
          </h3>
          {prescription ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{prescription}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No prescription from your doctor for this visit yet.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileDown className="h-4 w-4 text-teal-700" aria-hidden />
            Files from your doctor
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Referrals, summaries, or reports your doctor uploaded for this appointment.
          </p>
          <div className="mt-3">
            <AppointmentFileList
              files={doctorFiles}
              emptyMessage="No files from your doctor for this visit yet."
            />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
