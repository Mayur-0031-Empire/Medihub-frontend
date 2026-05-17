import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { formatConsultationFee, formatSlotRange } from "@/lib/appointments";
import type { PatientAppointment } from "@/types/appointment";
import { Building2, CalendarClock, FileText, Stethoscope, Video } from "lucide-react";
import { Link } from "react-router-dom";

function HistoryAvatar({ name, photo }: { name: string; photo?: string }) {
  const src = resolveMediaUrl(photo);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
      />
    );
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
      : (parts[0]?.slice(0, 2) ?? "DR").toUpperCase();
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-sm font-semibold text-teal-800"
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function AppointmentHistoryList({ appointments }: { appointments: PatientAppointment[] }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No appointments yet"
        description="When you book a visit, it will appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {appointments.map((a) => (
        <li
          key={a._id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex gap-4">
            <HistoryAvatar name={a.doctorName} photo={a.doctorPhoto} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{a.doctorName}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-teal-700">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {a.specialization}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {a.startAt ? formatSlotRange(a.startAt, a.endAt) : "Time to be confirmed"}
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {a.hospitalName}
                </li>
                {a.consultationFee != null && a.consultationFee > 0 ? (
                  <li className="font-medium text-slate-800">{formatConsultationFee(a.consultationFee)}</li>
                ) : null}
              </ul>
              {a.symptoms ? (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Symptoms: </span>
                  {a.symptoms}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/dashboard/patient/appointments/${a._id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-100"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  Prescription & records
                </Link>
                {!a.status.toLowerCase().includes("cancel") ? (
                  <Link
                    to={`/dashboard/patient/consult/${a._id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    <Video className="h-3.5 w-3.5" aria-hidden />
                    Join video visit
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
