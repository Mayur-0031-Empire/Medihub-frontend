import type { GeoPoint, HospitalMapView, NearbyHospital, NearbyHospitalsResult } from "@/types/hospital";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function stringField(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function boolField(o: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "boolean") return v;
  }
  return undefined;
}

function stringArrayField(o: Record<string, unknown>, ...keys: string[]): string[] | undefined {
  for (const k of keys) {
    const v = o[k];
    if (!Array.isArray(v)) continue;
    const lines = v
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return undefined;
}

function parseWorkingHours(o: Record<string, unknown>): Pick<NearbyHospital, "workingHours" | "workingHoursLines" | "openNow"> {
  const openNow = boolField(o, "openNow", "isOpen");
  const lines =
    stringArrayField(o, "workingHoursLines", "weekdayDescriptions") ??
    (() => {
      const nested = asRecord(o.openingHours) ?? asRecord(o.regularOpeningHours);
      if (!nested) return undefined;
      return stringArrayField(nested, "weekdayDescriptions", "descriptions");
    })();

  const single = stringField(o, "workingHours", "hours", "openingHoursText", "opening_hours");
  if (lines?.length) {
    const summary = lines.length <= 2 ? lines.join(" · ") : `${lines[0]} · ${lines[1]}${lines.length > 2 ? " · …" : ""}`;
    return { workingHours: summary, workingHoursLines: lines, openNow };
  }
  if (single) return { workingHours: single, openNow };
  return { openNow };
}

function parseGeoPoint(row: unknown): GeoPoint | undefined {
  const o = asRecord(row);
  if (!o) return undefined;
  const latitude = numberField(o, "latitude", "lat");
  const longitude = numberField(o, "longitude", "lng", "lon");
  if (latitude == null || longitude == null) return undefined;
  return { latitude, longitude };
}

function numberField(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function normalizeHospital(row: unknown): NearbyHospital | null {
  const o = asRecord(row);
  if (!o) return null;
  const name = stringField(o, "name");
  if (!name) return null;
  const placeId = stringField(o, "placeId", "_id", "id") ?? name;
  const hours = parseWorkingHours(o);
  return {
    placeId,
    name,
    address: stringField(o, "address") ?? "—",
    phone: stringField(o, "phone", "phoneNumber", "nationalPhoneNumber"),
    distanceKm: numberField(o, "distanceKm", "distance"),
    latitude: numberField(o, "latitude", "lat"),
    longitude: numberField(o, "longitude", "lng", "lon"),
    googleMapsUri: stringField(o, "googleMapsUri", "googleMapsUrl", "mapsUri"),
    websiteUri: stringField(o, "websiteUri", "website"),
    profilePicture: stringField(o, "profilePicture", "photo", "imageUrl", "photoUrl"),
    ...hours,
  };
}

function extractHospitalRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  if (Array.isArray(o.hospitals)) return o.hospitals;
  const inner = asRecord(o.data);
  if (inner && Array.isArray(inner.hospitals)) return inner.hospitals;
  return [];
}

function parseMapView(data: unknown): HospitalMapView | undefined {
  const o = asRecord(data);
  const mapObj = o ? (asRecord(o.map) ?? o) : null;
  const center = mapObj ? parseGeoPoint(mapObj.center ?? mapObj) : parseGeoPoint(data);
  if (!center) return undefined;
  const zoom = mapObj ? numberField(mapObj, "zoom", "defaultZoom") : undefined;
  const provider = mapObj ? stringField(mapObj, "provider") : undefined;
  return { center, zoom, provider };
}

export function normalizeNearbyHospitals(data: unknown): NearbyHospitalsResult {
  const o = asRecord(data);
  const rangeKm = o ? (numberField(o, "rangeKm", "range") ?? 5) : 5;
  const currentLocation = o ? parseGeoPoint(o.currentLocation) : undefined;
  const map = parseMapView(data);
  const rows = extractHospitalRows(data);
  const hospitals: NearbyHospital[] = [];
  for (const row of rows) {
    const h = normalizeHospital(row);
    if (h) hospitals.push(h);
  }
  hospitals.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  return { rangeKm, hospitals, currentLocation, map };
}
