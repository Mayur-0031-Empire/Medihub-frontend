import { normalizePortalRole } from "./auth/portalRole";

/** Default home route under `/dashboard` for the signed-in role. */
export function dashboardHomePath(role: string): string {
  const r = normalizePortalRole(role);
  if (r === "doctor") return "/dashboard/doctor";
  if (r === "admin") return "/dashboard/admin";
  return "/dashboard/patient";
}

/**
 * Validates `returnTo` from the login query string so we only redirect to safe in-app paths.
 */
export function safeDashboardReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let path: string;
  try {
    path = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  if (path.startsWith("//")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return null;
  if (path.startsWith("/dashboard")) return path;
  if (path === "/emergency" || path.startsWith("/emergency?")) return path;
  return null;
}