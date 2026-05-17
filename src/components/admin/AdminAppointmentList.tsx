import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatSlotRange } from "@/lib/appointments";
import type { PatientAppointment } from "@/types/appointment";
import { CalendarClock, Stethoscope, UserRound } from "lucide-react";

export function AdminAppointmentList({ appointments }: { appointments: PatientAppointment[] }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No bookings yet"
        description="Patient appointments will appear here once doctors have open slots and patients book visits."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {appointments.map((a) => (
        <li key={a._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Doctor ↔ Patient</p>
            <StatusBadge status={a.status} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-800">
                <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                Doctor
              </p>
              <p className="mt-1 font-semibold text-slate-900">{a.doctorName}</p>
              <p className="text-sm text-slate-600">{a.specialization}</p>
              <p className="mt-0.5 text-xs text-slate-500">{a.hospitalName}</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-800">
                <UserRound className="h-3.5 w-3.5" aria-hidden />
                Patient
              </p>
              <p className="mt-1 font-semibold text-slate-900">{a.patientName ?? "Patient (name not returned)"}</p>
              {a.patientEmail ? <p className="text-sm text-slate-600">{a.patientEmail}</p> : null}
              {a.patientPhone ? <p className="text-xs text-slate-500">{a.patientPhone}</p> : null}
            </div>
          </div>

          {a.startAt ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-700">
              <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              {formatSlotRange(a.startAt, a.endAt)}
            </p>
          ) : null}
          {a.symptoms ? (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Symptoms:</span> {a.symptoms}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
