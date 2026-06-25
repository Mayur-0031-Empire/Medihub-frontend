import type { ApiEnvelope } from "@/types/auth";
import { getAccessToken } from "@/lib/auth/session";
import { refreshAuthToken } from "@/lib/api/auth";
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

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isAuthExchangeRequest(url: string): boolean {
  return /\/api\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(url);
}

export type MedihubFetchOptions = RequestInit & {
  /** Do not attach Bearer token or retry on 401 (login/refresh calls). */
  authExchange?: boolean;
};

/** Same as fetch, but adds bearer token and clearer network/CORS errors. */
export async function medihubFetch(input: RequestInfo | URL, init?: MedihubFetchOptions): Promise<Response> {
  const authExchange = init?.authExchange === true;
  const { authExchange: _omit, ...requestInit } = init ?? {};

  const attempt = async (retryOnUnauthorized: boolean): Promise<Response> => {
    try {
      const headers = new Headers(requestInit.headers);
      const token = getAccessToken();
      if (token && !authExchange) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (!headers.has("Cache-Control")) {
        headers.set("Cache-Control", "no-cache");
      }
      if (!headers.has("Pragma")) {
        headers.set("Pragma", "no-cache");
      }
      const response = await fetch(input, {
        ...requestInit,
        headers,
        cache: requestInit.cache ?? "no-store",
      });

      const shouldRetry =
        retryOnUnauthorized &&
        response.status === 401 &&
        !authExchange &&
        Boolean(token) &&
        !isAuthExchangeRequest(requestUrl(input));

      if (shouldRetry) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          return attempt(false);
        }
      }

      return response;
    } catch (e) {
      wrapNetworkError(e);
    }
  };

  return attempt(true);
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
