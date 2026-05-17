import { getMedihubServer, sameOriginApiEnabled } from "./config";

/** Turn relative API photo paths into absolute URLs when possible. */
export function resolveMediaUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:")) return u;
  if (u.startsWith("/")) {
    if (sameOriginApiEnabled() && typeof window !== "undefined") {
      return `${window.location.origin}${u}`;
    }
    const base = getMedihubServer();
    if (base) return `${base}${u}`;
    return u;
  }
  return u;
}
