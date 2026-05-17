import { fetchAppointmentById, fetchMyAppointmentRows } from "@/lib/api/appointments";
import {
  enrichAppointmentDetail,
  normalizeAppointmentDetail,
  normalizePatientAppointment,
  pickPatientPrescription,
} from "@/lib/appointments/normalize";
import type { AppointmentDetail, AppointmentFileRef, PatientAppointment } from "@/types/appointment";

export interface PatientMedicalArchiveEntry {
  appointment: PatientAppointment;
  detail: AppointmentDetail | null;
  prescription: string;
  reportCount: number;
  doctorFiles: AppointmentFileRef[];
  hasPrescription: boolean;
  hasDoctorFiles: boolean;
}

function buildArchiveEntry(
  appointment: PatientAppointment,
  detail: AppointmentDetail | null,
): PatientMedicalArchiveEntry {
  const prescription = detail ? pickPatientPrescription(detail) : "";
  const doctorFiles = detail?.doctorFiles ?? [];
  return {
    appointment,
    detail,
    prescription,
    reportCount: detail?.patientReports?.length ?? 0,
    doctorFiles,
    hasPrescription: Boolean(prescription.trim()),
    hasDoctorFiles: doctorFiles.length > 0,
  };
}

function detailFromListRow(row: unknown): AppointmentDetail | null {
  const detail = normalizeAppointmentDetail(row);
  if (!detail) return null;
  return enrichAppointmentDetail(row, detail);
}

function visitHasDocuments(detail: AppointmentDetail | null): boolean {
  if (!detail) return false;
  return Boolean(pickPatientPrescription(detail).trim() || (detail.doctorFiles?.length ?? 0) > 0);
}

export async function loadPatientMedicalArchive(): Promise<PatientMedicalArchiveEntry[]> {
  const rows = await fetchMyAppointmentRows();
  const entries = await Promise.all(
    rows.map(async (row) => {
      const appointment = normalizePatientAppointment(row);
      if (!appointment) return null;

      let detail = detailFromListRow(row);
      if (!visitHasDocuments(detail)) {
        try {
          detail = await fetchAppointmentById(appointment._id);
        } catch {
          /* keep list-row detail if detail fetch fails (auth, network) */
        }
      }

      return buildArchiveEntry(appointment, detail);
    }),
  );

  const filtered = entries.filter((e): e is PatientMedicalArchiveEntry => e != null);
  return filtered.sort((a, b) => {
    const ta = new Date(a.appointment.startAt ?? a.appointment.createdAt ?? 0).getTime();
    const tb = new Date(b.appointment.startAt ?? b.appointment.createdAt ?? 0).getTime();
    return tb - ta;
  });
}
