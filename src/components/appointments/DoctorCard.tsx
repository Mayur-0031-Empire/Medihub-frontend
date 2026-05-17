import { DoctorAvatar } from "@/components/appointments/DoctorAvatar";
import { doctorDisplayName } from "@/lib/appointments";
import { formatConsultationFee } from "@/lib/appointments";
import type { PublicDoctorProfile } from "@/types/appointment";
import { Building2, CalendarPlus, Clock, IndianRupee, Stethoscope } from "lucide-react";

const cardClass =
  "flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md";

export function DoctorCard({
  doctor,
  selected,
  emergency = false,
  onBook,
}: {
  doctor: PublicDoctorProfile;
  selected: boolean;
  emergency?: boolean;
  onBook: () => void;
}) {
  const name = doctorDisplayName(doctor);

  return (
    <article
      className={[cardClass, selected ? "border-teal-400 ring-2 ring-teal-500/25" : ""].join(" ")}
    >
      <div className="flex gap-4">
        <DoctorAvatar doctor={doctor} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-slate-900">{name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-teal-700">
            <Stethoscope className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{doctor.specialization}</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              {doctor.experienceYears > 0
                ? `${doctor.experienceYears} year${doctor.experienceYears === 1 ? "" : "s"} experience`
                : "Experience not listed"}
            </li>
            <li className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="truncate">{doctor.hospitalName}</span>
            </li>
            <li className="flex items-center gap-2 font-medium text-slate-800">
              <IndianRupee className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              {formatConsultationFee(doctor.consultationFee)}
            </li>
          </ul>
          {doctor.availabilitySchedule ? (
            <p className="mt-2 text-xs text-slate-500">Usually available: {doctor.availabilitySchedule}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onBook}
        className={[
          "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition",
          emergency
            ? "bg-rose-600 shadow-rose-600/20 hover:bg-rose-700"
            : "bg-teal-600 shadow-teal-600/20 hover:bg-teal-700",
        ].join(" ")}
      >
        <CalendarPlus className="h-4 w-4" aria-hidden />
        {emergency ? "Book urgent visit" : "Book appointment"}
      </button>
    </article>
  );
}
