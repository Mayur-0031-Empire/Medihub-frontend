import { fetchNearbyHospitals, isServerConfigured } from "@/lib/api";
import { HOSPITAL_SEARCH_UNAVAILABLE, SERVICE_UNAVAILABLE, userFacingError } from "@/lib/userMessages";
import type { GeoPoint, NearbyHospital } from "@/types/hospital";
import { PATIENT_HOSPITAL_SEARCH_RANGE_KM } from "@/types/hospital";
import { useCallback, useEffect, useState, type FormEvent } from "react";

export type UseHospitalLocatorSearchOptions = {
  autoSearchOnMount?: boolean;
};

export function useHospitalLocatorSearch({ autoSearchOnMount = true }: UseHospitalLocatorSearchOptions = {}) {
  const serverOk = isServerConfigured();

  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(14);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(
    async (location: GeoPoint) => {
      if (!serverOk) {
        setError(SERVICE_UNAVAILABLE);
        return;
      }
      setSearching(true);
      setError(null);
      setHospitals([]);
      setSelectedPlaceId(null);
      setHasSearched(true);
      try {
        const data = await fetchNearbyHospitals({
          latitude: location.latitude,
          longitude: location.longitude,
          rangeKm: PATIENT_HOSPITAL_SEARCH_RANGE_KM,
          specialty: specialty.trim() || undefined,
          maxResultCount: 20,
        });
        setHospitals(data.hospitals);
        if (data.map?.zoom) setMapZoom(data.map.zoom);
        if (data.hospitals.length > 0) setSelectedPlaceId(data.hospitals[0].placeId);
        if (data.hospitals.length === 0) {
          setError(`No hospitals found within ${PATIENT_HOSPITAL_SEARCH_RANGE_KM} km. Try a different specialty.`);
        }
      } catch (err) {
        setError(userFacingError(err, HOSPITAL_SEARCH_UNAVAILABLE));
      } finally {
        setSearching(false);
      }
    },
    [serverOk, specialty],
  );

  const requestUserLocation = useCallback(
    (thenSearch = false) => {
      if (!navigator.geolocation) {
        setError("Location is not available in this browser.");
        return;
      }
      setLocating(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: GeoPoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(loc);
          setLocating(false);
          if (thenSearch) void runSearch(loc);
        },
        () => {
          setError("Could not read your location. Allow location access and try again.");
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    },
    [runSearch],
  );

  useEffect(() => {
    if (autoSearchOnMount) requestUserLocation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userLocation) {
      requestUserLocation(true);
      return;
    }
    void runSearch(userLocation);
  }

  const selectedHospital = hospitals.find((h) => h.placeId === selectedPlaceId) ?? null;
  const loading = locating || searching;

  return {
    serverOk,
    userLocation,
    specialty,
    setSpecialty,
    locating,
    searching,
    loading,
    error,
    hospitals,
    selectedPlaceId,
    setSelectedPlaceId,
    mapZoom,
    hasSearched,
    selectedHospital,
    requestUserLocation,
    onSubmit,
    rangeKm: PATIENT_HOSPITAL_SEARCH_RANGE_KM,
  };
}

export type HospitalLocatorSearchState = ReturnType<typeof useHospitalLocatorSearch>;
