import type { User } from "@/types/auth";
import {
  assertMedihubServerConfigured,
  authPathLogin,
  authPathLogout,
  authPathRefresh,
  authPathRegister,
} from "@/lib/config";
import {
  clearAccessToken,
  extractAccessTokenFromAuthResponse,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/session";
import type { RegisterFormValues } from "@/lib/auth/registerValidation";
import { formatApiFailure, isLikelyNetworkFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";
import { normalizeUser } from "./users";

export async function registerAccount(
  values: RegisterFormValues,
  roleOverride?: RegisterFormValues["role"],
): Promise<User> {
  const base = assertMedihubServerConfigured();
  const role = roleOverride ?? values.role;
  const fd = new FormData();
  fd.append("firstName", values.firstName.trim());
  fd.append("lastName", values.lastName.trim());
  fd.append("username", values.username.trim());
  fd.append("role", role);
  fd.append("email", values.email.trim());
  fd.append("phone", values.phone.trim());
  fd.append("password", values.password);
  fd.append("confirmPassword", values.confirmPassword);
  if (values.photo) {
    fd.append("photo", values.photo, values.photo.name);
  }

  const res = await medihubFetch(`${base}${authPathRegister()}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  const body = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Registration failed`));
  }

  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
  const token =
    extractAccessTokenFromAuthResponse(body) ??
    extractAccessTokenFromAuthResponse(unwrapped.data);
  if (token) setAccessToken(token);
  return normalizeUser(unwrapped.data);
}

export async function loginWithPassword(identifier: string, password: string): Promise<void> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${authPathLogin()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ identifier, password }),
  });

  const body = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: string }).message)
        : `Login failed`;
    throw new Error(msg);
  }

  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) {
    throw new Error(unwrapped.message);
  }
  const token =
    extractAccessTokenFromAuthResponse(body) ??
    extractAccessTokenFromAuthResponse(unwrapped.data);
  if (token) {
    setAccessToken(token);
  } else if (!getAccessToken()) {
    await refreshAuthToken();
  }
}

let refreshInFlight: Promise<boolean> | null = null;

export async function refreshAuthToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const base = assertMedihubServerConfigured();
      const res = await medihubFetch(`${base}${authPathRefresh()}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await parseJsonSafe(res);
      if (!res.ok) {
        return false;
      }
      const unwrapped = unwrapData<unknown>(body);
      const token =
        extractAccessTokenFromAuthResponse(body) ??
        (unwrapped.ok ? extractAccessTokenFromAuthResponse(unwrapped.data) : null);
      if (token) {
        setAccessToken(token);
      }
      return true;
    } catch (e) {
      if (isLikelyNetworkFailure(e)) {
        return false;
      }
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function logout(): Promise<void> {
  const base = assertMedihubServerConfigured();
  try {
    await medihubFetch(`${base}${authPathLogout()}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } finally {
    clearAccessToken();
  }
}
