import type { DoctorProfileFormState, DoctorQualificationRow } from "@/types/doctor";

const MAX_DOC_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type DoctorProfileField =
  | "specialization"
  | "experienceYears"
  | "hospitalName"
  | "consultationFee"
  | "availabilitySchedule"
  | "qualifications";

export type DoctorProfileErrors = Partial<Record<DoctorProfileField, string>>;

function rowErrors(rows: DoctorQualificationRow[], requireAtLeastOne: boolean): string | null {
  const complete = rows.filter((r) => r.title.trim() && r.file);
  if (requireAtLeastOne && complete.length === 0) {
    return "Add at least one qualification document with a title and file.";
  }
  for (const r of rows) {
    const hasTitle = Boolean(r.title.trim());
    const hasFile = Boolean(r.file);
    if (hasTitle !== hasFile) {
      return "Each new document needs both a title and a file.";
    }
  }
  for (const r of complete) {
    if (!r.file) continue;
    if (!ALLOWED_DOC_TYPES.has(r.file.type)) {
      return "Documents must be PDF, Word, or image (JPEG, PNG, WebP).";
    }
    if (r.file.size > MAX_DOC_BYTES) {
      return "Each document must be 10 MB or smaller.";
    }
  }
  return null;
}

export function validateDoctorProfileForm(
  values: DoctorProfileFormState,
  options?: { requireDocuments?: boolean },
): DoctorProfileErrors {
  const errors: DoctorProfileErrors = {};

  const spec = values.specialization.trim();
  if (!spec) errors.specialization = "Specialization is required.";
  else if (spec.length > 120) errors.specialization = "Use at most 120 characters.";

  const yearsRaw = values.experienceYears.trim();
  if (!yearsRaw) {
    errors.experienceYears = "Years of experience is required.";
  } else if (!/^\d+$/.test(yearsRaw)) {
    errors.experienceYears = "Enter a whole number (0–80).";
  } else {
    const n = Number.parseInt(yearsRaw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 80) {
      errors.experienceYears = "Enter a whole number from 0 to 80.";
    }
  }

  const hospital = values.hospitalName.trim();
  if (!hospital) errors.hospitalName = "Hospital or clinic name is required.";
  else if (hospital.length > 200) errors.hospitalName = "Use at most 200 characters.";

  const feeRaw = values.consultationFee.trim();
  if (!feeRaw) {
    errors.consultationFee = "Consultation fee is required.";
  } else {
    const fee = Number.parseFloat(feeRaw);
    if (!Number.isFinite(fee) || fee < 0) {
      errors.consultationFee = "Enter a valid fee (0 or greater).";
    }
  }

  const sched = values.availabilitySchedule.trim();
  if (!sched) {
    errors.availabilitySchedule = "Availability schedule is required (text or JSON per your API).";
  } else if (sched.length > 4000) {
    errors.availabilitySchedule = "Use at most 4000 characters.";
  }

  const requireDocs = options?.requireDocuments !== false;
  const qErr = rowErrors(values.qualifications, requireDocs);
  if (qErr) errors.qualifications = qErr;

  return errors;
}

/** Validates profile text fields; new documents are optional but must be complete when provided. */
export function validateDoctorProfileUpdateForm(values: DoctorProfileFormState): DoctorProfileErrors {
  return validateDoctorProfileForm(values, { requireDocuments: false });
}

export function hasDoctorProfileErrors(errors: DoctorProfileErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function doctorFormToCreatePayload(values: DoctorProfileFormState): {
  specialization: string;
  experienceYears: number;
  hospitalName: string;
  consultationFee: number;
  availabilitySchedule: string;
  documents: { title: string; file: File }[];
} {
  const documents = values.qualifications
    .filter((r): r is { title: string; file: File } => Boolean(r.title.trim() && r.file))
    .map((r) => ({ title: r.title.trim(), file: r.file! }));

  return {
    specialization: values.specialization.trim(),
    experienceYears: Number.parseInt(values.experienceYears.trim(), 10),
    hospitalName: values.hospitalName.trim(),
    consultationFee: Number.parseFloat(values.consultationFee.trim()),
    availabilitySchedule: values.availabilitySchedule.trim(),
    documents,
  };
}
