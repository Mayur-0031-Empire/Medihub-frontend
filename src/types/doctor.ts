/** One qualification file + its title for `POST /api/doctors/me`. */
export interface DoctorQualificationRow {
  title: string;
  file: File | null;
}

export function newDoctorQualificationRow(): DoctorQualificationRow {
  return { title: "", file: null };
}

/** Values collected in the doctor professional profile form (before multipart). */
export interface DoctorProfileFormState {
  specialization: string;
  experienceYears: string;
  hospitalName: string;
  consultationFee: string;
  availabilitySchedule: string;
  qualifications: DoctorQualificationRow[];
}
