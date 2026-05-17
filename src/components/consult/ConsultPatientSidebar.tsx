import { PatientDoctorFilesSection } from "@/components/appointments/PatientDoctorFilesSection";
import { ConsultMedicalUpload } from "@/components/consult/ConsultMedicalUpload";
import { PatientConsultPrescriptionCard } from "@/components/consult/PatientConsultPrescriptionCard";
import type { AppointmentDetail } from "@/types/appointment";

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
      <PatientConsultPrescriptionCard appt={appt} syncing={syncing} onRefresh={onRefresh} />
      <PatientDoctorFilesSection files={appt.doctorFiles ?? []} compact />
      <ConsultMedicalUpload appointmentId={appointmentId} appt={appt} onUpdated={onUpdated} compact />
    </aside>
  );
}
