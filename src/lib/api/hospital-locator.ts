import { assertMedihubServerConfigured, getMedihubFetchBase, hospitalLocatorNearbyPath } from "@/lib/config";
import { normalizeNearbyHospitals } from "@/lib/hospital-locator/normalize";
import type { NearbyHospitalsResult } from "@/types/hospital";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

export type FetchNearbyHospitalsParams = {
  latitude: number;
  longitude: number;
  rangeKm: number;
  specialty?: string;
  maxResultCount?: number;
};

/** Public `GET /api/hospital-locator/nearby` — no sign-in required. */
export async function fetchNearbyHospitals(params: FetchNearbyHospitalsParams): Promise<NearbyHospitalsResult> {
  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    rangeKm: String(params.rangeKm),
  });
  if (params.specialty?.trim()) q.set("specialty", params.specialty.trim());
  if (params.maxResultCount != null) q.set("maxResultCount", String(params.maxResultCount));

  assertMedihubServerConfigured();
  const base = getMedihubFetchBase();

  const res = await medihubFetch(`${base}${hospitalLocatorNearbyPath()}?${q}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load hospitals`));
  }
  const raw = unwrapData<unknown>(body);
  if (body !== null && typeof body === "object" && "success" in (body as object)) {
    if (!raw.ok) throw new Error(raw.message);
    return normalizeNearbyHospitals(raw.data);
  }
  return normalizeNearbyHospitals(body);
}
