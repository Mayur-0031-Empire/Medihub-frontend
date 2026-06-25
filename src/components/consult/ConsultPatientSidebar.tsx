import { PatientDoctorFilesSection } from "@/components/appointments/PatientDoctorFilesSection";
import { ConsultMedicalUpload } from "@/components/consult/ConsultMedicalUpload";
import { PatientConsultPrescriptionCard } from "@/components/consult/PatientConsultPrescriptionCard";
import { AppointmentStressCard } from "@/components/eeg/AppointmentStressCard";
import type { AppointmentDetail } from "@/types/appointment";
import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  appointmentId: string;
  appt: AppointmentDetail;
  onUpdated: (detail: AppointmentDetail) => void;
  syncing?: boolean;
  onRefresh?: () => void;
};

/** Patient video visit sidebar: live prescription + file upload for doctor. */
export function ConsultPatientSidebar({ appointmentId, appt, onUpdated, syncing, onRefresh }: Props) {
  return (
    <aside className="flex max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-y-auto">
      <section className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm">
        <AppointmentStressCard appointmentId={appointmentId} live />
        <Link
          to={`/dashboard/stress-monitor?appointmentId=${encodeURIComponent(appointmentId)}`}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
        >
          <Brain className="h-3.5 w-3.5" aria-hidden />
          Open stress monitor for this visit
        </Link>
      </section>
      <PatientConsultPrescriptionCard appt={appt} syncing={syncing} onRefresh={onRefresh} />
      <PatientDoctorFilesSection files={appt.doctorFiles ?? []} compact />
      <ConsultMedicalUpload appointmentId={appointmentId} appt={appt} onUpdated={onUpdated} compact />
    </aside>
  );
}
