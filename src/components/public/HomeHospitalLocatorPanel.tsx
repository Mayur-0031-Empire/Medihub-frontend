import { HospitalLocatorExperience } from "@/components/hospital-locator/HospitalLocatorExperience";
import { PATIENT_HOSPITAL_SEARCH_RANGE_KM } from "@/types/hospital";

/** Hospital search on the marketing home page — same experience as the patient portal. */
export function HomeHospitalLocatorPanel() {
  return (
    <HospitalLocatorExperience
      id="home-hospital-locator"
      showHospitalDashboard
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
  );
}
