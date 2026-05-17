import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatSlotRange, patientDisplayName } from "@/lib/appointments";
import type { PatientAppointment } from "@/types/appointment";
import { CalendarClock, ChevronRight, Mail, Phone, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

export function DoctorAppointmentList({ appointments }: { appointments: PatientAppointment[] }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No patient visits yet"
        description="When patients book your open slots, appointments appear here. Add availability under Manage slots."
        actionLabel="Manage slots"
        actionTo="/dashboard/doctor/slots"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {appointments.map((a) => (
        <li key={a._id}>
          <Link
            to={`/dashboard/doctor/appointments/${a._id}`}
            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md sm:p-5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-800">
              <UserRound className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{patientDisplayName(a)}</h3>
                  {a.symptoms ? (
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{a.symptoms}</p>
                  ) : (
                    <p className="mt-0.5 text-sm text-slate-500">No symptoms listed</p>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {a.startAt ? formatSlotRange(a.startAt, a.endAt) : "Time to be confirmed"}
                </li>
                {a.patientEmail ? (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="truncate">{a.patientEmail}</span>
                  </li>
                ) : null}
                {a.patientPhone ? (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    {a.patientPhone}
                  </li>
                ) : null}
              </ul>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
