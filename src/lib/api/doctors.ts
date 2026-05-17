import type { PublicDoctorProfile } from "@/types/appointment";
import {
  assertMedihubServerConfigured,
  doctorPathMe,
  doctorPathMeDocuments,
  doctorsPublicPath,
} from "@/lib/config";
import { extractDoctorListPayload, normalizePublicDoctor } from "@/lib/appointments/normalize";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

export interface DoctorProfileCreatePayload {
  specialization: string;
  experienceYears: number;
  hospitalName: string;
  consultationFee: number;
  availabilitySchedule: string;
  documents: { title: string; file: File }[];
}

/** `GET /api/doctors/me` — profile payload or `null` when no profile exists (404). */
export async function fetchDoctorMe(): Promise<unknown | null> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${doctorPathMe()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load doctor profile`));
  }
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
  return unwrapped.data;
}

export interface DoctorProfileUpdatePayload {
  specialization: string;
  experienceYears: number;
  hospitalName: string;
  consultationFee: number;
  availabilitySchedule: string;
}

export async function updateDoctorProfile(payload: DoctorProfileUpdatePayload): Promise<void> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${doctorPathMe()}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Doctor profile update failed`));
  }
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
}

export async function addDoctorDocuments(documents: { title: string; file: File }[]): Promise<void> {
  if (documents.length === 0) return;
  const base = assertMedihubServerConfigured();
  const fd = new FormData();
  fd.append("documentTitles", JSON.stringify(documents.map((d) => d.title)));
  for (const d of documents) {
    fd.append("documents", d.file, d.file.name);
  }
  const res = await medihubFetch(`${base}${doctorPathMeDocuments()}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not upload documents`));
  }
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
}

export async function createDoctorProfile(payload: DoctorProfileCreatePayload): Promise<void> {
  const base = assertMedihubServerConfigured();
  const fd = new FormData();
  fd.append("specialization", payload.specialization);
  fd.append("experienceYears", String(payload.experienceYears));
  fd.append("hospitalName", payload.hospitalName);
  fd.append("consultationFee", String(payload.consultationFee));
  fd.append("availabilitySchedule", payload.availabilitySchedule);
  fd.append("documentTitles", JSON.stringify(payload.documents.map((d) => d.title)));
  for (const d of payload.documents) {
    fd.append("documents", d.file, d.file.name);
  }

  const res = await medihubFetch(`${base}${doctorPathMe()}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Doctor profile save failed`));
  }
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
}

export async function fetchPublicDoctors(title?: string): Promise<PublicDoctorProfile[]> {
  const base = assertMedihubServerConfigured();
  const q = title?.trim() ? `?title=${encodeURIComponent(title.trim())}` : "";
  const res = await medihubFetch(`${base}${doctorsPublicPath()}${q}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load doctors`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const rows = extractDoctorListPayload(raw.data);
  const out: PublicDoctorProfile[] = [];
  for (const row of rows) {
    const d = normalizePublicDoctor(row);
    if (d) out.push(d);
  }
  return out;
}
