export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface NearbyHospital {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  profilePicture?: string;
  /** Short line for cards, e.g. "Mon–Fri 9:00 AM – 5:00 PM" */
  workingHours?: string;
  /** Full week lines when the API provides them */
  workingHoursLines?: string[];
  openNow?: boolean;
}

export interface HospitalMapView {
  center: GeoPoint;
  zoom?: number;
  provider?: string;
}

export interface NearbyHospitalsResult {
  rangeKm: number;
  hospitals: NearbyHospital[];
  currentLocation?: GeoPoint;
  map?: HospitalMapView;
}

/** Default search radius for the patient dashboard hospital locator. */
export const PATIENT_HOSPITAL_SEARCH_RANGE_KM = 2;
