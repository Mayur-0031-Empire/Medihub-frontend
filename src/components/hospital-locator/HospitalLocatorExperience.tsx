import { HospitalLocatorCard } from "@/components/hospital-locator/HospitalLocatorCard";
import { HospitalLocatorMap } from "@/components/hospital-locator/HospitalLocatorMap";
import { useHospitalLocatorSearch, type HospitalLocatorSearchState } from "@/hooks/useHospitalLocatorSearch";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import type { ReactNode } from "react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25";

export type HospitalLocatorExperienceProps = {
  id?: string;
  heading?: string;
  description?: ReactNode;
  showLocationBadge?: boolean;
  autoSearchOnMount?: boolean;
  showHospitalDashboard?: boolean;
  className?: string;
  /** Shared search state (e.g. from home page charts + locator). */
  search?: HospitalLocatorSearchState;
};

export function HospitalLocatorExperience({
  id,
  heading = "Hospital locator",
  description,
  showLocationBadge = true,
  autoSearchOnMount = true,
  className = "",
  search: searchProp,
}: HospitalLocatorExperienceProps) {
  const internalSearch = useHospitalLocatorSearch({ autoSearchOnMount: searchProp ? false : autoSearchOnMount });
  const search = searchProp ?? internalSearch;

  const {
    serverOk,
    userLocation,
    specialty,
    setSpecialty,
    locating,
    searching,
    error,
    hospitals,
    selectedPlaceId,
    setSelectedPlaceId,
    mapZoom,
    hasSearched,
    selectedHospital,
    requestUserLocation,
    onSubmit,
    rangeKm,
  } = search;

  return (
    <section id={id} className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-8 w-8 shrink-0 text-teal-600" aria-hidden />
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{heading}</h2>
            {description ? <p className="mt-1 text-sm text-slate-600 sm:text-base">{description}</p> : null}
          </div>
        </div>
        {showLocationBadge && userLocation ? (
          <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
            Your area: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </p>
        ) : null}
      </div>

      {!serverOk ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {SERVICE_UNAVAILABLE}
        </p>
      ) : (
        <>
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
            <div className="flex-1">
              <label htmlFor="hospital-locator-spec" className="mb-1 block text-sm font-medium text-slate-700">
                Specialty (optional)
              </label>
              <input
                id="hospital-locator-spec"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={searching}
                className={inputClass}
                placeholder="e.g. Cardiology, Emergency"
              />
            </div>
            <button
              type="button"
              onClick={() => requestUserLocation(false)}
              disabled={locating || searching}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-900 transition hover:bg-teal-100 disabled:opacity-50"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Update location
            </button>
            <button
              type="submit"
              disabled={searching || locating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-50"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search {rangeKm} km
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {searching && !hasSearched ? (
            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              Finding hospitals near you…
            </p>
          ) : null}

          {userLocation ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
              <div className="order-2 space-y-4 lg:order-1 lg:max-h-[min(32rem,calc(100dvh-14rem))] lg:overflow-y-auto lg:pr-1">
                {hospitals.length === 0 && hasSearched && !searching ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-600">
                    No hospitals to show. Update your location or adjust the specialty filter.
                  </p>
                ) : (
                  hospitals.map((h) => (
                    <HospitalLocatorCard
                      key={h.placeId}
                      hospital={h}
                      selected={h.placeId === selectedPlaceId}
                      onSelect={() => setSelectedPlaceId(h.placeId)}
                    />
                  ))
                )}
              </div>
              <div className="order-1 lg:sticky lg:top-4 lg:order-2">
                <HospitalLocatorMap
                  userLocation={userLocation}
                  hospitals={hospitals}
                  rangeKm={rangeKm}
                  selectedPlaceId={selectedPlaceId}
                  zoom={mapZoom}
                />
                {selectedHospital?.workingHoursLines && selectedHospital.workingHoursLines.length > 1 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    <p className="font-semibold text-slate-900">{selectedHospital.name} — hours</p>
                    <ul className="mt-2 space-y-1">
                      {selectedHospital.workingHoursLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : locating ? (
            <p className="mt-8 text-center text-sm text-slate-600">Getting your location…</p>
          ) : null}
        </>
      )}
    </section>
  );
}
