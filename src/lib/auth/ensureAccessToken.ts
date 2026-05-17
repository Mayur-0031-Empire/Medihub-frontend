import { refreshAuthToken } from "@/lib/api/auth";
import { sameOriginApiEnabled } from "@/lib/config";
import {
  getAccessToken,
  readAccessTokenFromCookie,
  setAccessToken,
} from "@/lib/auth/session";

export type SocketConnectionAuth =
  | { kind: "bearer"; token: string }
  | { kind: "cookie" };

/**
 * Socket.IO auth for video consult.
 * - Same-origin (Vite proxy): HttpOnly `accessToken` cookie via `withCredentials` (README).
 * - Cross-origin: Bearer token in `auth.token` (login/refresh JSON or readable cookie).
 */
export async function resolveSocketConnectionAuth(): Promise<SocketConnectionAuth> {
  let token = getAccessToken();
  if (!token) {
    const fromCookie = readAccessTokenFromCookie();
    if (fromCookie) {
      setAccessToken(fromCookie);
      token = fromCookie;
    }
  }

  if (token) {
    return { kind: "bearer", token };
  }

  if (sameOriginApiEnabled()) {
    await refreshAuthToken();
    return { kind: "cookie" };
  }

  const refreshed = await refreshAuthToken();
  token = getAccessToken();
  if (token) {
    return { kind: "bearer", token };
  }

  if (refreshed) {
    throw new Error(
      "Your session is active but no access token was returned. For split-host deploys, the API must include accessToken in the login or refresh JSON body. For local dev, set VITE_MEDIHUB_SAME_ORIGIN=true so Socket.IO uses cookies through the Vite proxy.",
    );
  }

  throw new Error("Please sign in again to start a video consult.");
}

/** @deprecated Use resolveSocketConnectionAuth — kept for callers that need a raw Bearer string. */
export async function ensureAccessTokenForSocket(): Promise<string> {
  const auth = await resolveSocketConnectionAuth();
  if (auth.kind === "bearer") return auth.token;
  throw new Error(
    "No Bearer token in session; use same-origin Socket.IO (VITE_MEDIHUB_SAME_ORIGIN=true) or return accessToken from the API.",
  );
}
