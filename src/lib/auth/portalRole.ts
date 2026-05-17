import type { PortalRole } from "@/types/auth";

/** Normalize API or query string values to a MediHub portal role. */
export function normalizePortalRole(value: string | null | undefined): PortalRole | null {
  const x = String(value ?? "").toLowerCase();
  if (x === "patient" || x === "doctor" || x === "admin") return x;
  return null;
}

/** Read `?portal=` from a search string (e.g. `window.location.search`). */
export function portalFromSearchString(search: string): PortalRole {
  const p = normalizePortalRole(new URLSearchParams(search).get("portal"));
  return p ?? "patient";
}

export function registerPathForRole(role: PortalRole): string {
  return `/register/${role}`;
}
