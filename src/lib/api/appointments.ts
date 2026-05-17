import { userFacingError } from "@/lib/userMessages";
import type {
  AppointmentDetail,
  AppointmentFileRef,
  AppointmentNotification,
  AppointmentSlot,
  AppointmentSlotInput,
  BookAppointmentPayload,
  PatientAppointment,
  UpdateDoctorNotesPayload,
  UpdatePatientSymptomsPayload,
} from "@/types/appointment";
import {
  assertMedihubServerConfigured,
  appointmentAiDraftPath,
  appointmentByIdPath,
  appointmentCancelByDoctorPath,
  appointmentRestoreByDoctorPath,
  appointmentDoctorFileDeletePath,
  appointmentDoctorFilesPath,
  appointmentDoctorNotesPath,
  appointmentNotificationsPath,
  appointmentPatientReportsPath,
  appointmentPatientSymptomsPath,
  appointmentPrescriptionApprovePath,
  appointmentsAdminSlotsBulkPath,
  appointmentsAdminSlotsPath,
  appointmentsBookPath,
  appointmentsAdminListPath,
  appointmentsAllListPath,
  appointmentsMePath,
  appointmentsSlotsPath,
  doctorSlotsPath,
} from "@/lib/config";
import { isServerConfigured } from "@/lib/api/server";
import { filterBookableSlots } from "@/lib/appointments/local";
import {
  extractAppointmentsPayload,
  extractNotificationsPayload,
  extractSlotsPayload,
  enrichAppointmentDetail,
  extractDoctorFilesFromPayload,
  mergeDoctorFileLists,
  normalizeAppointmentDetail,
  normalizeAppointmentNotification,
  normalizeAppointmentSlot,
  normalizePatientAppointment,
} from "@/lib/appointments/normalize";
import { dedupeSlotInputs, isSlotDuplicateError } from "@/lib/appointments/slots";
import { symptomsForBookApi } from "@/lib/appointments/symptoms";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

export interface CreateSlotsResult {
  created: number;
  skipped: number;
}

async function postSlotsJson(url: string, body: Record<string, unknown>): Promise<void> {
  const res = await medihubFetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const resBody = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(formatApiFailure(resBody, `Could not create slots`));
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  const raw = unwrapData<unknown>(resBody);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
}

export async function createAppointmentSlots(slots: AppointmentSlotInput[]): Promise<CreateSlotsResult> {
  if (slots.length === 0) {
    throw new Error("Add at least one time slot.");
  }
  const base = assertMedihubServerConfigured();
  const url = `${base}${appointmentsSlotsPath()}`;
  const unique = dedupeSlotInputs(slots);

  try {
    await postSlotsJson(url, { slots: unique });
    return { created: unique.length, skipped: slots.length - unique.length };
  } catch (e) {
    const message = userFacingError(e, "");
    if (!isSlotDuplicateError(message)) throw e;

    let created = 0;
    let skipped = 0;
    for (const slot of unique) {
      try {
        await postSlotsJson(url, { slots: [slot] });
        created++;
      } catch (inner) {
        const innerMsg = inner instanceof Error ? inner.message : "";
        if (isSlotDuplicateError(innerMsg)) {
          skipped++;
          continue;
        }
        throw inner;
      }
    }
    if (created === 0) {
      throw new Error(
        "These time slots already exist for this day. Remove duplicates or pick times not listed under open slots.",
      );
    }
    return { created, skipped: skipped + (slots.length - unique.length) };
  }
}

export async function createAppointmentSlotsForDoctor(
  doctorProfileId: string,
  slots: AppointmentSlotInput[],
): Promise<void> {
  if (!doctorProfileId) {
    throw new Error("Select a doctor first.");
  }
  if (slots.length === 0) {
    throw new Error("Add at least one time slot.");
  }
  const base = assertMedihubServerConfigured();
  const id = doctorProfileId;
  const attempts: { url: string; body: Record<string, unknown> }[] = [
    { url: `${base}${appointmentsAdminSlotsPath(id)}`, body: { slots } },
    {
      url: `${base}${appointmentsAdminSlotsBulkPath()}`,
      body: { doctorProfileId: id, doctorId: id, doctor: id, slots },
    },
    {
      url: `${base}${appointmentsSlotsPath()}`,
      body: { slots, doctorProfileId: id, doctorId: id, doctor: id },
    },
  ];

  let lastMessage = "Could not create slots for this doctor.";
  for (const { url, body } of attempts) {
    try {
      await postSlotsJson(url, body);
      return;
    } catch (e) {
      const err = e as Error & { status?: number };
      lastMessage = err.message || lastMessage;
      if (err.status === 404 || err.status === 405) {
        continue;
      }
      if (err.status === 403) {
        throw new Error(
          `${lastMessage} The server may only allow the doctor account to add slots — use Doctor portal → Manage slots while signed in as that doctor, or enable admin slot APIs on the backend.`,
        );
      }
      throw err;
    }
  }
  throw new Error(lastMessage);
}

export async function fetchDoctorSlots(
  doctorProfileId: string,
  from: Date,
  to: Date,
): Promise<AppointmentSlot[]> {
  const base = assertMedihubServerConfigured();
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const res = await medihubFetch(`${base}${doctorSlotsPath(doctorProfileId)}?${params}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load slots`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const rows = extractSlotsPayload(raw.data);
  const out: AppointmentSlot[] = [];
  for (const row of rows) {
    const slot = normalizeAppointmentSlot(row, doctorProfileId);
    if (slot && slot.status.toLowerCase() === "available") out.push(slot);
  }
  return filterBookableSlots(out).sort((a, b) => a.startAt.localeCompare(b.startAt));
}

function sortAppointmentsNewestFirst(list: PatientAppointment[]): PatientAppointment[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.startAt ?? a.createdAt ?? 0).getTime();
    const tb = new Date(b.startAt ?? b.createdAt ?? 0).getTime();
    return tb - ta;
  });
}

function normalizeAppointmentRows(rows: unknown[]): PatientAppointment[] {
  const out: PatientAppointment[] = [];
  for (const row of rows) {
    const a = normalizePatientAppointment(row);
    if (a) out.push(a);
  }
  return out;
}

async function fetchAppointmentsFromPath(path: string): Promise<PatientAppointment[]> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${path}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load appointments`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  return normalizeAppointmentRows(extractAppointmentsPayload(raw.data));
}

export async function fetchMyAppointments(): Promise<PatientAppointment[]> {
  return sortAppointmentsNewestFirst(await fetchAppointmentsFromPath(appointmentsMePath()));
}

/** Raw appointment rows from `GET /api/appointments/me` (for archive normalization). */
export async function fetchMyAppointmentRows(): Promise<unknown[]> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentsMePath()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load appointments`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  return extractAppointmentsPayload(raw.data);
}

/**
 * Loads all platform bookings for the admin dashboard.
 * Tries `/me`, `/admin`, and `/appointments` and merges unique rows (backend routes vary).
 */
/**
 * Best-effort platform bookings for public analytics (home charts).
 * Returns empty array when the endpoint requires authentication.
 */
export async function fetchPublicAppointmentsForAnalytics(): Promise<PatientAppointment[]> {
  if (!isServerConfigured()) return [];
  const paths = [appointmentsAllListPath(), appointmentsAdminListPath()];
  const merged = new Map<string, PatientAppointment>();

  for (const path of paths) {
    try {
      const rows = await fetchAppointmentsFromPath(path);
      for (const a of rows) merged.set(a._id, a);
    } catch {
      /* not available to guests */
    }
  }

  return sortAppointmentsNewestFirst([...merged.values()]);
}

export async function fetchAdminAppointments(): Promise<PatientAppointment[]> {
  const paths = [appointmentsMePath(), appointmentsAdminListPath(), appointmentsAllListPath()];
  const uniquePaths = [...new Set(paths)];
  const merged = new Map<string, PatientAppointment>();
  const errors: string[] = [];

  await Promise.all(
    uniquePaths.map(async (path) => {
      try {
        const rows = await fetchAppointmentsFromPath(path);
        for (const a of rows) merged.set(a._id, a);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }),
  );

  if (merged.size > 0) {
    return sortAppointmentsNewestFirst([...merged.values()]);
  }

  if (errors.length === uniquePaths.length) {
    throw new Error(errors[0] ?? "Could not load appointments.");
  }

  return [];
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<PatientAppointment> {
  const base = assertMedihubServerConfigured();
  const apiBody = {
    ...payload,
    symptoms: symptomsForBookApi(payload.symptoms),
  };
  const res = await medihubFetch(`${base}${appointmentsBookPath()}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiBody),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Booking failed`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const appt = normalizePatientAppointment(raw.data);
  if (appt) return appt;
  throw new Error("Unexpected booking response.");
}

export async function fetchAppointmentById(appointmentId: string): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentByIdPath(appointmentId)}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load appointment`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const appt = normalizeAppointmentDetail(raw.data);
  if (appt) return enrichAppointmentDetail(raw.data, appt);
  throw new Error("Unexpected appointment response.");
}

export async function uploadPatientAppointmentReports(
  appointmentId: string,
  files: File[],
  titles?: string[],
): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const form = new FormData();
  for (const f of files) form.append("reports", f);
  if (titles?.length) form.append("titles", JSON.stringify(titles));
  const res = await medihubFetch(`${base}${appointmentPatientReportsPath(appointmentId)}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not upload medical records`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const appt = normalizeAppointmentDetail(raw.data);
  if (appt) return appt;
  throw new Error("Unexpected response after uploading records.");
}

export async function updatePatientAppointmentSymptoms(
  appointmentId: string,
  payload: UpdatePatientSymptomsPayload,
): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const bodyJson: Record<string, unknown> = {};
  if (payload.symptoms !== undefined) {
    bodyJson.symptoms = symptomsForBookApi(
      Array.isArray(payload.symptoms) ? payload.symptoms.join("\n") : payload.symptoms,
    );
  }
  if (payload.patientNotes?.trim()) {
    bodyJson.patientNotes = payload.patientNotes.trim();
  }
  const res = await medihubFetch(`${base}${appointmentPatientSymptomsPath(appointmentId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyJson),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not update visit details`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const appt = normalizeAppointmentDetail(raw.data);
  if (appt) return appt;
  throw new Error("Unexpected response after updating symptoms.");
}

export async function updateDoctorAppointmentNotes(
  appointmentId: string,
  payload: UpdateDoctorNotesPayload,
): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentDoctorNotesPath(appointmentId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not save notes`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const appt = normalizeAppointmentDetail(raw.data);
  if (appt) return appt;
  throw new Error("Unexpected response after saving notes.");
}

export async function uploadDoctorAppointmentFiles(
  appointmentId: string,
  files: File[],
  titles?: string[],
): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const form = new FormData();
  for (const f of files) form.append("files", f);
  if (titles?.length) form.append("titles", JSON.stringify(titles));
  const res = await medihubFetch(`${base}${appointmentDoctorFilesPath(appointmentId)}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not upload files`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  let appt = normalizeAppointmentDetail(raw.data);
  const uploaded = extractDoctorFilesFromPayload(raw.data);
  if (appt && uploaded.length) {
    appt = { ...appt, doctorFiles: mergeDoctorFileLists(appt.doctorFiles, uploaded) };
  }
  if (appt) return appt;
  if (uploaded.length) {
    const refetched = await fetchAppointmentById(appointmentId);
    return { ...refetched, doctorFiles: mergeDoctorFileLists(refetched.doctorFiles, uploaded) };
  }
  throw new Error("Unexpected response after upload.");
}

function deleteDoctorFileBody(file: AppointmentFileRef, index: number): Record<string, unknown> {
  if (file._id) return { fileId: file._id, id: file._id };
  if (file.url?.trim()) return { url: file.url.trim(), fileUrl: file.url.trim() };
  if (file.title?.trim()) return { title: file.title.trim(), name: file.title.trim() };
  return { index };
}

/** Remove one doctor-shared file from a visit (doctor role). */
export async function deleteDoctorAppointmentFile(
  appointmentId: string,
  file: AppointmentFileRef,
  index: number,
): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const body = deleteDoctorFileBody(file, index);
  const attempts: { url: string; withBody: boolean }[] = [];

  if (file._id) {
    attempts.push({
      url: `${base}${appointmentDoctorFileDeletePath(appointmentId, file._id)}`,
      withBody: false,
    });
  }
  attempts.push({ url: `${base}${appointmentDoctorFilesPath(appointmentId)}`, withBody: true });

  let lastMessage = "Could not delete file.";
  for (const { url, withBody } of attempts) {
    const res = await medihubFetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: withBody ? { "Content-Type": "application/json" } : undefined,
      body: withBody ? JSON.stringify(body) : undefined,
    });
    const resBody = await parseJsonSafe(res);
    if (res.ok) {
      const raw = unwrapData<unknown>(resBody);
      if (!raw.ok) throw new Error(raw.message);
      const appt = normalizeAppointmentDetail(raw.data);
      if (appt) return appt;
      return fetchAppointmentById(appointmentId);
    }
    lastMessage = formatApiFailure(resBody, lastMessage);
    if (res.status === 404 || res.status === 405 || res.status === 501) continue;
    throw new Error(lastMessage);
  }
  throw new Error(
    `${lastMessage} If delete is not enabled on your MediHub server yet, add DELETE on /api/appointments/:appointmentId/doctor-files.`,
  );
}

export async function generateAppointmentAiDraft(appointmentId: string): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentAiDraftPath(appointmentId)}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `AI draft failed`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const appt = normalizeAppointmentDetail(raw.data);
  if (appt) return appt;
  if (raw.data && typeof raw.data === "object") {
    const nested = normalizeAppointmentDetail({ appointment: raw.data });
    if (nested) return nested;
  }
  throw new Error("Unexpected AI draft response. Check that AI is enabled on the MediHub server.");
}

export async function approveAppointmentPrescription(
  appointmentId: string,
  approvedText: string,
): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentPrescriptionApprovePath(appointmentId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approvedText }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not approve prescription`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const appt = normalizeAppointmentDetail(raw.data);
  if (appt) return appt;
  throw new Error("Unexpected response after approving prescription.");
}

/** Re-activate a doctor-cancelled visit (restore endpoint, then status patch fallback). */
export async function restoreAppointmentByDoctor(appointmentId: string): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentRestoreByDoctorPath(appointmentId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await parseJsonSafe(res);
  if (res.ok) {
    const raw = unwrapData<unknown>(body);
    if (!raw.ok) throw new Error(raw.message);
    const appt = normalizeAppointmentDetail(raw.data);
    if (appt) return appt;
    const nested = raw.data && typeof raw.data === "object"
      ? normalizeAppointmentDetail({ appointment: raw.data })
      : null;
    if (nested) return nested;
  }
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    const restored = await updateDoctorAppointmentNotes(appointmentId, { status: "scheduled" });
    if (!restored.status.toLowerCase().includes("cancel")) return restored;
    throw new Error(
      "Could not restore this appointment. Please try again or contact support if the problem continues.",
    );
  }
  throw new Error(formatApiFailure(body, `Could not restore appointment`));
}

export async function cancelAppointmentByDoctor(
  appointmentId: string,
  reason?: string,
): Promise<AppointmentDetail> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentCancelByDoctorPath(appointmentId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not cancel appointment`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const appt = normalizeAppointmentDetail(raw.data);
  if (appt) return appt;
  throw new Error("Unexpected response after cancellation.");
}

export async function fetchAppointmentNotifications(): Promise<AppointmentNotification[]> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentNotificationsPath()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load notifications`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const rows = extractNotificationsPayload(raw.data ?? body);
  const out: AppointmentNotification[] = [];
  rows.forEach((row, index) => {
    const n = normalizeAppointmentNotification(row, index);
    if (n) out.push(n);
  });
  return out.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
