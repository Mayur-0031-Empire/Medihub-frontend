import type { User } from "@/types/auth";
import {
  assertMedihubServerConfigured,
  userPathMe,
  userPathMePassword,
  userPathMePhoto,
} from "@/lib/config";
import { normalizePortalRole } from "@/lib/auth/portalRole";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

/** Fields allowed by `PATCH /api/users/me` (README). */
export interface UserProfilePatchPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  age?: number;
}

function withNormalizedRole(body: object): User {
  const roleNorm = normalizePortalRole(String((body as { role?: unknown }).role ?? ""));
  if (!roleNorm) {
    throw new Error("Unexpected profile response shape.");
  }
  return { ...(body as User), role: roleNorm };
}

export function normalizeUser(data: unknown): User {
  if (data && typeof data === "object" && "user" in data) {
    const inner = (data as { user: unknown }).user;
    if (inner && typeof inner === "object" && "_id" in inner && "role" in inner) {
      return withNormalizedRole(inner as object);
    }
  }
  if (data && typeof data === "object" && "_id" in data && "role" in data) {
    return withNormalizedRole(data as object);
  }
  throw new Error("Unexpected profile response shape.");
}

function compactProfilePayload(values: UserProfilePatchPayload): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 0) out[k] = t;
    } else if (typeof v === "number" && !Number.isNaN(v)) {
      out[k] = v;
    }
  }
  return out;
}

export async function fetchCurrentUser(): Promise<User> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${userPathMe()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: string }).message)
        : `Could not load profile`;
    throw new Error(msg);
  }

  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
  return normalizeUser(unwrapped.data);
}

export async function patchCurrentUserProfile(payload: UserProfilePatchPayload): Promise<User> {
  const bodyJson = compactProfilePayload(payload);
  if (Object.keys(bodyJson).length === 0) {
    throw new Error("Change at least one profile field before saving.");
  }
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${userPathMe()}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyJson),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not update profile`));
  }
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
  try {
    return normalizeUser(unwrapped.data);
  } catch {
    return fetchCurrentUser();
  }
}

export async function patchCurrentUserPhoto(photo: File): Promise<User> {
  const base = assertMedihubServerConfigured();
  const fd = new FormData();
  fd.append("photo", photo, photo.name);
  const res = await medihubFetch(`${base}${userPathMePhoto()}`, {
    method: "PATCH",
    credentials: "include",
    body: fd,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not update photo`));
  }
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
  try {
    return normalizeUser(unwrapped.data);
  } catch {
    return fetchCurrentUser();
  }
}

export async function patchCurrentUserPassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${userPathMePassword()}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not update password`));
  }
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
}
