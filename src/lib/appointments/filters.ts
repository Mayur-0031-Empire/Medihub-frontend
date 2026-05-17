import type { DoctorListFilters, ExperienceFilter, FeeFilter, PublicDoctorProfile } from "@/types/appointment";

function matchesExperience(years: number, band: ExperienceFilter): boolean {
  if (band === "any") return true;
  if (band === "0-2") return years <= 2;
  if (band === "3-5") return years >= 3 && years <= 5;
  if (band === "6-10") return years >= 6 && years <= 10;
  if (band === "10+") return years >= 10;
  return true;
}

function matchesFee(fee: number, band: FeeFilter): boolean {
  if (band === "any") return true;
  if (band === "under-500") return fee < 500;
  if (band === "500-1000") return fee >= 500 && fee <= 1000;
  if (band === "over-1000") return fee > 1000;
  return true;
}

export function filterDoctors(
  doctors: PublicDoctorProfile[],
  filters: DoctorListFilters,
): PublicDoctorProfile[] {
  return doctors.filter((d) => {
    if (filters.speciality && d.specialization !== filters.speciality) return false;
    if (filters.hospital && d.hospitalName !== filters.hospital) return false;
    if (!matchesExperience(d.experienceYears, filters.experience)) return false;
    if (!matchesFee(d.consultationFee, filters.fees)) return false;
    return true;
  });
}

export function collectFilterOptions(doctors: PublicDoctorProfile[]): {
  specialities: string[];
  hospitals: string[];
} {
  const spec = new Set<string>();
  const hosp = new Set<string>();
  for (const d of doctors) {
    if (d.specialization) spec.add(d.specialization);
    if (d.hospitalName) hosp.add(d.hospitalName);
  }
  return {
    specialities: [...spec].sort((a, b) => a.localeCompare(b)),
    hospitals: [...hosp].sort((a, b) => a.localeCompare(b)),
  };
}
