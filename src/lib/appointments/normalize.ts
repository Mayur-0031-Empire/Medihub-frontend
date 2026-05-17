import { formatSymptomsForDisplay } from "@/lib/appointments/symptoms";
import type {
  AppointmentDetail,
  AppointmentFileRef,
  AppointmentNotification,
  AppointmentSlot,
  PatientAppointment,
  PublicDoctorProfile,
  PublicDoctorUser,
} from "@/types/appointment";

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

function normalizeDoctorUser(raw: unknown): PublicDoctorUser | undefined {
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

export function normalizePublicDoctor(row: unknown): PublicDoctorProfile | null {
  const o = asRecord(row);
  if (!o) return null;
  const _id = idFrom(o);
  if (!_id) return null;
  const specialization =
    stringField(o, "specialization", "speciality", "title", "specialty") ?? "General practice";
  const hospitalName = stringField(o, "hospitalName", "hospital", "clinicName") ?? "—";
  const experienceYears = numberField(o, "experienceYears", "experience", "yearsOfExperience") ?? 0;
  const consultationFee = numberField(o, "consultationFee", "fee", "fees", "consultationFees") ?? 0;
  const verifiedTitles = Array.isArray(o.verifiedTitles)
    ? o.verifiedTitles.map(String).filter(Boolean)
    : [];
  return {
    _id,
    specialization,
    experienceYears,
    hospitalName,
    consultationFee,
    availabilitySchedule: stringField(o, "availabilitySchedule", "schedule"),
    verifiedTitles,
    user: normalizeDoctorUser(o.user),
  };
}

export function extractDoctorListPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  for (const k of ["doctors", "items", "results", "rows", "profiles"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(o.data)) return o.data as unknown[];
  const inner = asRecord(o.data);
  if (inner && Array.isArray(inner.doctors)) return inner.doctors as unknown[];
  return [];
}

export function normalizeAppointmentSlot(row: unknown, doctorProfileId: string): AppointmentSlot | null {
  const o = asRecord(row);
  if (!o) return null;
  const _id = idFrom(o);
  const startAt = stringField(o, "startAt", "start", "startsAt");
  const endAt = stringField(o, "endAt", "end", "endsAt");
  if (!_id || !startAt || !endAt) return null;
  const profileId =
    stringField(o, "doctorProfile", "doctorProfileId") ??
    (typeof o.doctorProfile === "object" ? idFrom(asRecord(o.doctorProfile) ?? {}) : undefined) ??
    doctorProfileId;
  return {
    _id,
    doctorProfileId: profileId,
    doctorUserId: stringField(o, "doctor", "doctorId", "doctorUserId"),
    startAt,
    endAt,
    status: stringField(o, "status") ?? "available",
  };
}

export function extractSlotsPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  for (const k of ["slots", "items", "availability"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(o.data)) return o.data as unknown[];
  return [];
}

function doctorDisplayFromEmbed(embed: Record<string, unknown> | null): {
  name: string;
  specialization: string;
  hospitalName: string;
  fee?: number;
  photo?: string;
  profileId?: string;
} {
  if (!embed) {
    return { name: "Doctor", specialization: "—", hospitalName: "—" };
  }
  const user = normalizeDoctorUser(embed.user);
  const first = user?.firstName ?? "";
  const last = user?.lastName ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim() || "Doctor";
  return {
    name,
    specialization: stringField(embed, "specialization", "speciality", "title") ?? "—",
    hospitalName: stringField(embed, "hospitalName", "hospital") ?? "—",
    fee: numberField(embed, "consultationFee", "fee"),
    photo: user?.photo,
    profileId: idFrom(embed),
  };
}

export function normalizePatientAppointment(row: unknown): PatientAppointment | null {
  const o = asRecord(row);
  if (!o) return null;
  const _id = idFrom(o);
  if (!_id) return null;

  const slot = asRecord(o.slot);
  const startAt = stringField(o, "startAt") ?? (slot ? stringField(slot, "startAt", "start") : undefined);
  const endAt = stringField(o, "endAt") ?? (slot ? stringField(slot, "endAt", "end") : undefined);
  const slotId = slot ? idFrom(slot) : stringField(o, "slotId", "slot");

  const doctorEmbed =
    asRecord(o.doctorProfile) ?? asRecord(o.doctor) ?? asRecord(o.doctorDetails);
  const doc = doctorDisplayFromEmbed(doctorEmbed);

  const patientEmbed =
    asRecord(o.patient) ?? asRecord(o.patientProfile) ?? asRecord(o.patientUser);
  const patientUser = patientEmbed ? normalizeDoctorUser(patientEmbed.user ?? patientEmbed) : undefined;
  const patientFirst = patientUser?.firstName ?? stringField(o, "patientFirstName");
  const patientLast = patientUser?.lastName ?? stringField(o, "patientLastName");
  const patientName =
    stringField(o, "patientName") ??
    ([patientFirst, patientLast].filter(Boolean).join(" ").trim() || undefined);

  return {
    _id,
    status: stringField(o, "status") ?? "scheduled",
    slotId,
    startAt,
    endAt,
    symptoms: formatSymptomsForDisplay(o.symptoms) ?? stringField(o, "symptoms"),
    patientNotes: stringField(o, "patientNotes", "notes"),
    doctorProfileId: doc.profileId ?? stringField(o, "doctorProfileId"),
    doctorName:
      stringField(o, "doctorName", "doctorFullName") ??
      doc.name ??
      (doc.profileId ? `Doctor ${doc.profileId.slice(-6)}` : "Doctor"),
    specialization: stringField(o, "specialization") ?? doc.specialization,
    hospitalName: stringField(o, "hospitalName") ?? doc.hospitalName,
    consultationFee: numberField(o, "consultationFee", "fee") ?? doc.fee,
    doctorPhoto: stringField(o, "doctorPhoto") ?? doc.photo,
    patientName,
    patientEmail: patientUser?.email ?? stringField(o, "patientEmail"),
    patientPhone: patientUser?.phone ?? stringField(o, "patientPhone"),
    createdAt: stringField(o, "createdAt", "bookedAt"),
  };
}

export function extractAppointmentsPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  for (const k of ["appointments", "items", "results", "rows", "bookings", "list"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(o.data)) return o.data as unknown[];
  const inner = asRecord(o.data);
  if (inner) {
    for (const k of ["appointments", "items", "results", "rows", "bookings", "list"]) {
      const v = inner[k];
      if (Array.isArray(v)) return v as unknown[];
    }
  }
  return [];
}

function dedupeFileRefs(files: AppointmentFileRef[]): AppointmentFileRef[] {
  const seen = new Set<string>();
  const out: AppointmentFileRef[] = [];
  for (const f of files) {
    const key = `${f.url ?? ""}|${f.title ?? f.name ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

const UPLOADER_ROLE_HINTS = ["doctor", "physician", "clinician", "patient", "user", "admin", "provider"];

function isUploaderRoleTag(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return UPLOADER_ROLE_HINTS.some((hint) => v.includes(hint));
}

function fileRefFromRecord(o: Record<string, unknown>): AppointmentFileRef | null {
  const nested = asRecord(o.file) ?? asRecord(o.asset) ?? asRecord(o.document);
  const url =
    stringField(
      o,
      "url",
      "fileUrl",
      "secureUrl",
      "path",
      "href",
      "link",
      "documentUrl",
      "downloadUrl",
      "location",
      "storagePath",
      "storageKey",
      "key",
      "publicId",
    ) ??
    (nested
      ? stringField(
          nested,
          "url",
          "fileUrl",
          "secureUrl",
          "path",
          "href",
          "link",
          "documentUrl",
          "downloadUrl",
          "location",
          "storagePath",
        )
      : undefined);
  const title =
    stringField(o, "title", "name", "fileName", "filename", "originalname", "originalName") ??
    (nested ? stringField(nested, "title", "name", "fileName", "filename", "originalname", "originalName") : undefined);
  if (!url && !title) return null;
  const _id = idFrom(o) ?? (nested ? idFrom(nested) : undefined) ?? stringField(o, "fileId", "documentId");
  return { _id, url, title, name: title };
}

function normalizeFileRefs(raw: unknown): AppointmentFileRef[] {
  if (!Array.isArray(raw)) return [];
  const out: AppointmentFileRef[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push({ url: item.trim(), title: "Document", name: "Document" });
      continue;
    }
    const o = asRecord(item);
    if (!o) continue;
    const ref = fileRefFromRecord(o);
    if (ref) out.push(ref);
  }
  return out;
}

function uploaderRole(item: unknown): string | undefined {
  const o = asRecord(item);
  if (!o) return undefined;
  for (const key of ["uploadedBy", "uploader", "role", "source", "uploadedByRole", "ownerRole"]) {
    const v = stringField(o, key);
    if (isUploaderRoleTag(v)) return v!.toLowerCase();
  }
  const kind = stringField(o, "kind", "fileKind", "category", "documentType");
  if (isUploaderRoleTag(kind)) return kind!.toLowerCase();
  return undefined;
}

function hasPatientReportFiles(fields: Record<string, unknown>): boolean {
  for (const key of ["patientReports", "patient_reports", "reports", "medicalReports"]) {
    const v = fields[key];
    if (Array.isArray(v) && v.length > 0) return true;
  }
  return false;
}

function normalizeDoctorFileRefsFromAttachmentsObject(raw: unknown): AppointmentFileRef[] {
  const o = asRecord(raw);
  if (!o) return [];
  const merged: AppointmentFileRef[] = [];
  for (const key of [
    "doctor",
    "doctorFiles",
    "doctor_files",
    "fromDoctor",
    "provider",
    "clinician",
    "sharedWithPatient",
  ]) {
    merged.push(...normalizeFileRefs(o[key]));
  }
  return merged;
}

/** When the API uses one `files` / `documents` array, keep only doctor-uploaded rows. */
function normalizeDoctorFileRefsFromMixedArray(raw: unknown): AppointmentFileRef[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const roles = raw.map(uploaderRole);
  const hasRole = roles.some(Boolean);
  if (!hasRole) return [];
  const doctorOnly = raw.filter((item) => {
    const role = uploaderRole(item);
    return role?.includes("doctor") || role === "physician" || role === "clinician";
  });
  return normalizeFileRefs(doctorOnly);
}

function collectDoctorFileRefs(...sources: Record<string, unknown>[]): AppointmentFileRef[] {
  const merged: AppointmentFileRef[] = [];
  for (const fields of sources) {
    for (const key of [
      "doctorFiles",
      "doctorAttachments",
      "doctor_attachments",
      "doctorDocuments",
      "doctor_files",
      "doctor_documents",
      "sharedFiles",
      "sharedDocuments",
      "consultationFiles",
      "providerFiles",
      "uploadedFiles",
      "uploaded",
      "newFiles",
      "filesAdded",
    ]) {
      merged.push(...normalizeFileRefs(fields[key]));
    }
    merged.push(...normalizeDoctorFileRefsFromMixedArray(fields.files));
    merged.push(...normalizeDoctorFileRefsFromMixedArray(fields.documents));
    merged.push(...normalizeDoctorFileRefsFromMixedArray(fields.attachments));
    merged.push(...normalizeDoctorFileRefsFromAttachmentsObject(fields.attachments));
    merged.push(...normalizeDoctorFileRefsFromAttachmentsObject(fields.documents));
    // Legacy: doctor uploads only in `files` when there are no patient reports on the same object.
    if (!merged.length && fields.files != null && !hasPatientReportFiles(fields)) {
      merged.push(...normalizeFileRefs(fields.files));
    }
  }
  return dedupeFileRefs(merged);
}

/** Pull doctor file refs from upload/detail payloads that nest files outside `appointment`. */
export function extractDoctorFilesFromPayload(data: unknown): AppointmentFileRef[] {
  const o = asRecord(data);
  if (!o) return normalizeFileRefs(data);
  const nested = asRecord(o.appointment);
  const fromNested = nested ? collectDoctorFileRefs(nested, o) : [];
  if (fromNested.length) return fromNested;
  return collectDoctorFileRefs(o);
}

/** Merge doctor file lists after an upload without losing prior documents. */
export function mergeDoctorFileLists(
  existing: AppointmentFileRef[] | undefined,
  incoming: AppointmentFileRef[],
): AppointmentFileRef[] {
  return dedupeFileRefs([...(existing ?? []), ...incoming]);
}

function collectPatientReportRefs(...sources: Record<string, unknown>[]): AppointmentFileRef[] {
  const merged: AppointmentFileRef[] = [];
  for (const fields of sources) {
    for (const key of ["patientReports", "patient_reports", "reports", "medicalReports"]) {
      merged.push(...normalizeFileRefs(fields[key]));
    }
    merged.push(
      ...normalizeFileRefs(
        Array.isArray(fields.files)
          ? (fields.files as unknown[]).filter((item) => {
              const role = uploaderRole(item);
              return role?.includes("patient") || role === "user";
            })
          : [],
      ),
    );
  }
  return dedupeFileRefs(merged);
}

function prescriptionFromNested(o: Record<string, unknown>): {
  prescriptionDraft?: string;
  prescriptionText?: string;
  approvedPrescription?: string;
} {
  const ai = asRecord(o.aiDraft) ?? asRecord(o.ai) ?? asRecord(o.generated);
  const rx = asRecord(o.prescription);
  const notes = asRecord(o.consultationNotes) ?? asRecord(o.clinicalNotes);
  const consult = asRecord(o.consultation);
  return {
    prescriptionDraft:
      stringField(o, "prescriptionDraft", "aiPrescriptionDraft", "draftPrescription") ??
      (ai ? stringField(ai, "prescription", "prescriptionDraft", "prescriptionText", "text", "content") : undefined) ??
      (notes ? stringField(notes, "prescription", "prescriptionDraft") : undefined) ??
      (consult ? stringField(consult, "prescriptionDraft", "draftPrescription") : undefined) ??
      (rx ? stringField(rx, "draftText", "draft", "prescriptionDraft", "text") : undefined) ??
      stringField(o, "aiConsultationNotes"),
    prescriptionText:
      stringField(o, "prescriptionText", "rx", "rxText") ??
      (typeof o.prescription === "string" ? o.prescription.trim() : undefined) ??
      (rx
        ? stringField(rx, "text", "body", "content", "draft", "draftText", "prescription", "prescriptionText", "rx")
        : undefined) ??
      (consult ? stringField(consult, "prescriptionText", "prescription") : undefined),
    approvedPrescription:
      stringField(o, "approvedPrescription", "approvedText", "finalPrescription", "rxApproved") ??
      (rx ? stringField(rx, "approvedText", "approvedPrescription", "finalText", "finalPrescription") : undefined) ??
      (consult ? stringField(consult, "approvedPrescription", "approvedText") : undefined),
  };
}

/** Apply upload/detail payload extras (top-level files, nested appointment). */
export function enrichAppointmentDetail(row: unknown, detail: AppointmentDetail): AppointmentDetail {
  const extraFiles = extractDoctorFilesFromPayload(row);
  if (!extraFiles.length) return detail;
  return { ...detail, doctorFiles: mergeDoctorFileLists(detail.doctorFiles, extraFiles) };
}

/** Resolve appointment detail from API payloads that nest under `appointment`. */
export function normalizeAppointmentDetail(row: unknown): AppointmentDetail | null {
  const o = asRecord(row);
  const nested = o ? asRecord(o.appointment) : null;
  const target = nested ?? row;
  const base = normalizePatientAppointment(target);
  if (!base) return null;
  const fields = asRecord(target);
  if (!fields) return base;
  const rx = prescriptionFromNested(fields);
  const topRx = o ? prescriptionFromNested(o) : {};
  const detail: AppointmentDetail = {
    ...base,
    doctorDiagnosis: stringField(fields, "doctorDiagnosis", "diagnosis"),
    doctorNotes: stringField(fields, "doctorNotes", "notes"),
    meetingTranscript: stringField(fields, "meetingTranscript", "transcript"),
    prescriptionDraft: rx.prescriptionDraft ?? topRx.prescriptionDraft,
    approvedPrescription: rx.approvedPrescription ?? topRx.approvedPrescription,
    prescriptionText: rx.prescriptionText ?? topRx.prescriptionText,
    cancelReason: stringField(fields, "cancelReason", "reason"),
    patientReports: collectPatientReportRefs(fields, ...(o && nested ? [o] : [])),
    doctorFiles: collectDoctorFileRefs(fields, ...(o && nested ? [o] : [])),
  };
  return enrichAppointmentDetail(row, detail);
}

export function pickDisplayedPrescription(detail: AppointmentDetail): string {
  return (
    detail.prescriptionDraft?.trim() ||
    detail.prescriptionText?.trim() ||
    detail.approvedPrescription?.trim() ||
    ""
  );
}

/** Patient-facing: prefer doctor-approved final prescription. */
export function pickPatientPrescription(detail: AppointmentDetail): string {
  return (
    detail.approvedPrescription?.trim() ||
    detail.prescriptionText?.trim() ||
    detail.prescriptionDraft?.trim() ||
    ""
  );
}

export function normalizeAppointmentNotification(row: unknown, index = 0): AppointmentNotification | null {
  const o = asRecord(row);
  if (!o) return null;
  const _id = idFrom(o) ?? stringField(o, "notificationId") ?? `notif-${index}`;
  const title = stringField(o, "title", "subject", "heading");
  const body = stringField(o, "message", "body", "text", "content", "description", "detail");
  const type = stringField(o, "type", "event", "kind");
  let message = body;
  if (!message && title) message = title;
  if (!message && type) {
    const apptId = stringField(o, "appointmentId") ?? idFrom(asRecord(o.appointment) ?? {});
    message = apptId ? `${type} — appointment ${apptId}` : type;
  }
  if (!message) return null;
  if (title && body && title !== body) message = `${title}: ${body}`;
  const typeRaw = stringField(o, "type", "event", "kind", "category");
  const kindFromType = (() => {
    const t = typeRaw?.toLowerCase() ?? "";
    if (t.includes("prescription") || t.includes("rx")) return "prescription" as const;
    if (t.includes("file") || t.includes("document")) return "doctor_files" as const;
    if (t.includes("cancel")) return "cancellation" as const;
    if (t.includes("book") || t.includes("appointment") || t.includes("visit")) return "appointment" as const;
    return undefined;
  })();

  return {
    _id,
    message,
    read: o.read === true || o.isRead === true || o.status === "read",
    createdAt: stringField(o, "createdAt", "created_at", "timestamp", "date"),
    appointmentId:
      stringField(o, "appointmentId", "appointment_id") ?? idFrom(asRecord(o.appointment) ?? {}),
    kind: kindFromType,
    source: "api",
  };
}

export function extractNotificationsPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  for (const k of ["notifications", "items", "results", "rows", "list", "data"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(o.data)) return o.data as unknown[];
  const inner = asRecord(o.data);
  if (inner) {
    for (const k of ["notifications", "items", "results"]) {
      const v = inner[k];
      if (Array.isArray(v)) return v as unknown[];
    }
  }
  return [];
}

export function patientDisplayName(appt: PatientAppointment): string {
  return appt.patientName?.trim() || "Patient";
}

export function doctorDisplayName(doctor: PublicDoctorProfile): string {
  const u = doctor.user;
  const n = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
  return n || "Doctor";
}
