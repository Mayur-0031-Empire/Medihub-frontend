import type { DoctorQualificationDocument, PendingDoctorProfile } from "@/types/admin";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function stringField(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function numberField(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function idFrom(o: Record<string, unknown>): string | undefined {
  return stringField(o, "_id", "id");
}

function normalizeDocument(row: unknown): DoctorQualificationDocument | null {
  const o = asRecord(row);
  if (!o) return null;
  const _id = idFrom(o);
  if (!_id) return null;
  const title = stringField(o, "title", "name", "documentTitle") ?? "Document";
  return {
    _id,
    title,
    url: stringField(o, "url", "fileUrl", "documentUrl", "path", "secureUrl"),
    verificationStatus: stringField(o, "verificationStatus", "status"),
  };
}

function normalizeUser(raw: unknown): PendingDoctorProfile["user"] {
  const o = asRecord(raw);
  if (!o) return undefined;
  return {
    firstName: stringField(o, "firstName"),
    lastName: stringField(o, "lastName"),
    email: stringField(o, "email"),
    phone: stringField(o, "phone"),
    photo: stringField(o, "photo", "photoUrl", "avatar"),
  };
}

export function normalizePendingDoctor(row: unknown): PendingDoctorProfile | null {
  const o = asRecord(row);
  if (!o) return null;
  const _id = idFrom(o);
  if (!_id) return null;

  const docSources = [o.documents, o.qualificationDocuments, o.files];
  const documents: DoctorQualificationDocument[] = [];
  for (const src of docSources) {
    if (!Array.isArray(src)) continue;
    for (const item of src) {
      const doc = normalizeDocument(item);
      if (doc) documents.push(doc);
    }
  }

  return {
    _id,
    specialization: stringField(o, "specialization", "speciality", "title") ?? "—",
    experienceYears: numberField(o, "experienceYears", "experience") ?? 0,
    hospitalName: stringField(o, "hospitalName", "hospital") ?? "—",
    consultationFee: numberField(o, "consultationFee", "fee", "fees") ?? 0,
    availabilitySchedule: stringField(o, "availabilitySchedule", "schedule"),
    verificationStatus: stringField(o, "verificationStatus", "status"),
    user: normalizeUser(o.user),
    documents,
  };
}

export function extractPendingDoctorsPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  for (const k of ["doctors", "pending", "items", "results", "profiles", "rows"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(o.data)) return o.data as unknown[];
  const inner = asRecord(o.data);
  if (inner) {
    for (const k of ["doctors", "pending", "items", "profiles"]) {
      const v = inner[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}
