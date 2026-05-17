import { newDoctorQualificationRow, type DoctorProfileFormState } from "@/types/doctor";

export type ExistingDoctorDocument = {
  title: string;
  url?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function stringField(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function numberToStringField(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeExistingDocument(row: unknown): ExistingDoctorDocument | null {
  const o = asRecord(row);
  if (!o) return null;
  const title = stringField(o, "title", "name", "documentTitle");
  if (!title) return null;
  return {
    title,
    url: stringField(o, "url", "fileUrl", "documentUrl", "path", "secureUrl") || undefined,
  };
}

function extractExistingDocuments(me: Record<string, unknown>): ExistingDoctorDocument[] {
  const out: ExistingDoctorDocument[] = [];
  for (const key of ["documents", "qualificationDocuments", "files"]) {
    const src = me[key];
    if (!Array.isArray(src)) continue;
    for (const item of src) {
      const doc = normalizeExistingDocument(item);
      if (doc) out.push(doc);
    }
  }
  return out;
}

/** Map `GET /api/doctors/me` JSON into editable form values. */
export function doctorMeToFormState(me: unknown): {
  values: DoctorProfileFormState;
  existingDocuments: ExistingDoctorDocument[];
} {
  const o = asRecord(me) ?? {};
  return {
    values: {
      specialization: stringField(o, "specialization", "speciality", "title"),
      experienceYears: numberToStringField(o, "experienceYears", "experience"),
      hospitalName: stringField(o, "hospitalName", "hospital"),
      consultationFee: numberToStringField(o, "consultationFee", "fee", "fees"),
      availabilitySchedule: stringField(o, "availabilitySchedule", "schedule"),
      qualifications: [newDoctorQualificationRow()],
    },
    existingDocuments: extractExistingDocuments(o),
  };
}
