export interface PublicDoctorUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  photo?: string;
}

export interface PublicDoctorProfile {
  _id: string;
  specialization: string;
  experienceYears: number;
  hospitalName: string;
  consultationFee: number;
  availabilitySchedule?: string;
  verifiedTitles?: string[];
  user?: PublicDoctorUser;
}

export interface AppointmentSlot {
  _id: string;
  doctorProfileId: string;
  doctorUserId?: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface AppointmentFileRef {
  _id?: string;
  title?: string;
  url?: string;
  name?: string;
}

export interface PatientAppointment {
  _id: string;
  status: string;
  slotId?: string;
  startAt?: string;
  endAt?: string;
  symptoms?: string;
  patientNotes?: string;
  doctorProfileId?: string;
  doctorName: string;
  specialization: string;
  hospitalName: string;
  consultationFee?: number;
  doctorPhoto?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  createdAt?: string;
}

/** Full appointment record for doctor workspace (detail API). */
export interface AppointmentDetail extends PatientAppointment {
  doctorDiagnosis?: string;
  doctorNotes?: string;
  meetingTranscript?: string;
  prescriptionDraft?: string;
  approvedPrescription?: string;
  prescriptionText?: string;
  cancelReason?: string;
  patientReports?: AppointmentFileRef[];
  doctorFiles?: AppointmentFileRef[];
}

export type AppointmentNotificationKind =
  | "appointment"
  | "prescription"
  | "doctor_files"
  | "cancellation"
  | "general";

export interface AppointmentNotification {
  _id: string;
  message: string;
  read?: boolean;
  createdAt?: string;
  appointmentId?: string;
  kind?: AppointmentNotificationKind;
  /** Present when synthesized from appointments because the notifications API returned nothing. */
  source?: "api" | "appointment" | "sync";
}

export interface UpdateDoctorNotesPayload {
  doctorDiagnosis?: string;
  doctorNotes?: string;
  meetingTranscript?: string;
  status?: string;
}

export interface UpdatePatientSymptomsPayload {
  symptoms?: string | string[];
  patientNotes?: string;
}

export interface AppointmentSlotInput {
  startAt: string;
  endAt: string;
}

export interface BookAppointmentPayload {
  slotId: string;
  /** Free text in the UI; sent to the API as a string array. */
  symptoms?: string | string[];
  patientNotes?: string;
  trainingConsent?: boolean;
  isEmergency?: boolean;
}

export type ExperienceFilter = "any" | "0-2" | "3-5" | "6-10" | "10+";

export type FeeFilter = "any" | "under-500" | "500-1000" | "over-1000";

export interface DoctorListFilters {
  speciality: string;
  hospital: string;
  experience: ExperienceFilter;
  fees: FeeFilter;
}

export const DEFAULT_DOCTOR_FILTERS: DoctorListFilters = {
  speciality: "",
  hospital: "",
  experience: "any",
  fees: "any",
};
