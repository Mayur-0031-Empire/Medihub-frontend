import { refreshAuthToken } from "@/lib/api/auth";
import { clearAccessToken, getAccessToken, readAccessTokenFromCookie, setAccessToken } from "@/lib/auth/session";

let bootstrapInFlight: Promise<boolean> | null = null;
let bootstrapped = false;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, skewMs = 10_000): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false;
  return exp * 1000 <= Date.now() + skewMs;
}

function readValidStoredToken(): string | null {
  const stored = getAccessToken();
  if (!stored) return null;
  if (isAccessTokenExpired(stored)) {
    clearAccessToken();
    return null;
  }
  return stored;
}

/**
 * Restores a session across tabs and browser restarts using the refresh cookie
 * and any persisted bearer token.
 */
export async function bootstrapSession(force = false): Promise<boolean> {
  if (!force && bootstrapped) {
    return Boolean(readValidStoredToken());
  }

  if (bootstrapInFlight) {
    return bootstrapInFlight;
  }

  bootstrapInFlight = (async () => {
    const validStored = readValidStoredToken();
    if (validStored) {
      bootstrapped = true;
      return true;
    }

    const fromCookie = readAccessTokenFromCookie();
    if (fromCookie && !isAccessTokenExpired(fromCookie)) {
      setAccessToken(fromCookie);
      bootstrapped = true;
      return true;
    }

    const refreshed = await refreshAuthToken();
    bootstrapped = true;
    return refreshed;
  })().finally(() => {
    bootstrapInFlight = null;
  });

  return bootstrapInFlight;
}

export function markSessionBootstrapped(): void {
  bootstrapped = true;
}
