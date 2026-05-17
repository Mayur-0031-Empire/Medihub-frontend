import { HomeNetworkDashboard } from "@/components/public/HomeNetworkDashboard";
import { HospitalLocatorExperience } from "@/components/hospital-locator/HospitalLocatorExperience";
import { useHospitalLocatorSearch } from "@/hooks/useHospitalLocatorSearch";
import { PATIENT_HOSPITAL_SEARCH_RANGE_KM } from "@/types/hospital";

/** Home page: care network charts + nearby hospital locator (separate purposes). */
export function HomeHospitalTools() {
  const search = useHospitalLocatorSearch({ autoSearchOnMount: true });

  return (
    <div className="space-y-8">
      <HomeNetworkDashboard />
      <HospitalLocatorExperience
        id="home-hospital-locator"
        search={search}
        autoSearchOnMount={false}
        showHospitalDashboard={false}
        className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8"
        heading="Hospital locator"
        description={
          <>
            Find nearby hospitals within{" "}
            <span className="font-semibold text-teal-800">{PATIENT_HOSPITAL_SEARCH_RANGE_KM} km</span> — image, phone,
            hours, and address on each card, with a live map. No sign-in required.
          </>
        }
      />
    </div>
  );
}
