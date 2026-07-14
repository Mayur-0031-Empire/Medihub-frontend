import type { PortalRole } from "@/types/auth";
import { assertMedihubServerOrigin, getMedihubServer } from "@/lib/config";

/** True when `.env` has a server URL (social buttons stay enabled for wiring). */
export function isServerConfigured(): boolean {
  return Boolean(getMedihubServer());
}

function getOAuthRedirectUrl(): string {
  const configured = import.meta.env.VITE_OAUTH_REDIRECT_URL;
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback`;
}

/**
 * Start OAuth on the MediHub backend. Adjust paths in `.env` if your API uses different routes.
 */
export function buildOAuthStartUrl(path: string, portal: PortalRole): string {
  const base = assertMedihubServerOrigin();
  const full = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const url = new URL(full);
  url.searchParams.set("portal", portal);
  const redirect = getOAuthRedirectUrl();
  if (redirect) {
    url.searchParams.set("redirect_uri", redirect);
  }
  return url.toString();
}
