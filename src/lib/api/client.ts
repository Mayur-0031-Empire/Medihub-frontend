import type { ApiEnvelope } from "@/types/auth";
import { getAccessToken } from "@/lib/auth/session";
import { NETWORK_ERROR, sanitizeUserFacingMessage } from "@/lib/userMessages";

const NETWORK_HELP = NETWORK_ERROR;

export function isLikelyNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("network request failed")
  );
}

function wrapNetworkError(error: unknown): never {
  if (isLikelyNetworkFailure(error)) {
    throw new Error(NETWORK_HELP);
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(String(error));
}

/** Same as fetch, but adds bearer token and clearer network/CORS errors. */
export async function medihubFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const token = getAccessToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Avoid 304 + empty body on GET (breaks JSON parse); consult poll must always get fresh data.
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", "no-cache");
    }
    if (!headers.has("Pragma")) {
      headers.set("Pragma", "no-cache");
    }
    return await fetch(input, {
      ...init,
      headers,
      cache: init?.cache ?? "no-store",
    });
  } catch (e) {
    wrapNetworkError(e);
  }
}

export async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function unwrapData<T>(body: unknown): { ok: true; data: T } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Unexpected empty response." };
  }
  const envelope = body as ApiEnvelope<T>;
  if ("success" in envelope && envelope.success === false) {
    return {
      ok: false,
      message: sanitizeUserFacingMessage(envelope.message ?? "Request failed."),
    };
  }
  if ("data" in envelope && envelope.data !== undefined) {
    return { ok: true, data: envelope.data };
  }
  return { ok: true, data: body as T };
}

export function formatApiFailure(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as { message?: unknown; errors?: unknown };
    if (typeof o.message === "string" && o.message.trim()) {
      return sanitizeUserFacingMessage(o.message.trim(), fallback);
    }
    if (Array.isArray(o.errors) && o.errors.length > 0) {
      const combined = o.errors
        .map((e) => (typeof e === "string" ? e : JSON.stringify(e)))
        .join(" ");
      return sanitizeUserFacingMessage(combined, fallback);
    }
  }
  return fallback;
}
