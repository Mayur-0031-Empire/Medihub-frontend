import type { PendingDoctorProfile, VerifyDoctorPayload } from "@/types/admin";
import {
  assertMedihubServerConfigured,
  doctorAdminPendingPath,
  doctorAdminVerifyPath,
} from "@/lib/config";
import {
  extractPendingDoctorsPayload,
  normalizePendingDoctor,
} from "@/lib/doctors/adminNormalize";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

/** `GET /api/doctors/admin/pending` — doctors awaiting document verification. */
export async function fetchAdminPendingDoctors(): Promise<PendingDoctorProfile[]> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${doctorAdminPendingPath()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load pending doctors`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const rows = extractPendingDoctorsPayload(raw.data);
  const out: PendingDoctorProfile[] = [];
  for (const row of rows) {
    const d = normalizePendingDoctor(row);
    if (d) out.push(d);
  }
  return out;
}

/** `PATCH /api/doctors/admin/:doctorProfileId/verify` */
export async function verifyAdminDoctor(
  doctorProfileId: string,
  payload: VerifyDoctorPayload,
): Promise<void> {
  const base = assertMedihubServerConfigured();
  const bodyJson: Record<string, unknown> = {
    verificationStatus: payload.verificationStatus,
  };
  if (payload.documentIds?.length) {
    bodyJson.documentIds = payload.documentIds;
  }
  if (payload.rejectionReason?.trim()) {
    bodyJson.rejectionReason = payload.rejectionReason.trim();
  }
  if (payload.isRecommended !== undefined) {
    bodyJson.isRecommended = payload.isRecommended;
  }
  const res = await medihubFetch(`${base}${doctorAdminVerifyPath(doctorProfileId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyJson),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Verification failed`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
}
