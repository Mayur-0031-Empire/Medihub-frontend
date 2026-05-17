import { filterBookableSlots } from "@/lib/appointments/local";
import type { AppointmentSlot, PublicDoctorProfile } from "@/types/appointment";

const EMERGENCY_PATTERN = /emergency|urgent|trauma|critical|icu|casualty/i;

export function isEmergencyDoctor(doctor: PublicDoctorProfile): boolean {
  if (EMERGENCY_PATTERN.test(doctor.specialization)) return true;
  return (doctor.verifiedTitles ?? []).some((t) => EMERGENCY_PATTERN.test(t));
}

/** Prefer doctors tagged for emergency care; fall back to the full list if none match. */
export function prioritizeEmergencyDoctors(doctors: PublicDoctorProfile[]): PublicDoctorProfile[] {
  const emergency = doctors.filter(isEmergencyDoctor);
  if (emergency.length > 0) {
    return [...emergency, ...doctors.filter((d) => !isEmergencyDoctor(d))];
  }
  return doctors;
}

export function pickEarliestFutureSlot(slots: AppointmentSlot[], now = new Date()): string | null {
  const bookable = filterBookableSlots(slots, now).sort((a, b) => a.startAt.localeCompare(b.startAt));
  return bookable[0]?._id ?? null;
}

export const EMERGENCY_NOTES_PREFIX = "[Urgent care request]";
