import { BookAppointmentPanel } from "@/components/appointments/BookAppointmentPanel";
import { DoctorCard } from "@/components/appointments/DoctorCard";
import {fetchPublicDoctors, isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { isEmergencyDoctor, prioritizeEmergencyDoctors } from "@/lib/appointments";
import { getAccessToken } from "@/lib/auth";
import type { PublicDoctorProfile } from "@/types/appointment";
import { AlertTriangle, ArrowLeft, Loader2, LogIn, Phone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function EmergencyAppointmentPage() {
  const serverOk = isServerConfigured();
  const signedIn = Boolean(getAccessToken());
  const [doctors, setDoctors] = useState<PublicDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<PublicDoctorProfile | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchPublicDoctors("Emergency");
      setDoctors(prioritizeEmergencyDoctors(rows));
    } catch (e) {
      setLoadError(userFacingError(e, "Could not load doctors."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  const emergencyDoctors = useMemo(() => doctors.filter(isEmergencyDoctor), [doctors]);
  const loginHref = `/login?portal=patient&returnTo=${encodeURIComponent("/emergency")}`;

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
          <h1 className="text-lg font-semibold">Emergency appointments</h1>
          <p className="mt-2 text-sm">{SERVICE_UNAVAILABLE}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <section className="border-b border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-amber-50/60 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-800">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Urgent care
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Book an emergency visit with a doctor
              </h1>
              <p className="mt-3 text-slate-600">
                Find a clinician with the soonest open slot. Sign in as a patient to confirm your booking.
              </p>
            </div>
            <div className="flex max-w-md flex-col gap-3 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
              <p className="flex gap-2 text-sm leading-relaxed text-rose-950">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                If you or someone else is in immediate danger, call your local emergency number (e.g. 911 or 112)
                before booking here.
              </p>
              {!signedIn ? (
                <Link
                  to={loginHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  Sign in to book
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-8">
        {loadError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {loadError}
          </div>
        ) : null}

        {!signedIn ? (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="font-medium text-slate-900">Patient sign-in required</p>
            <p className="mt-1 text-sm text-slate-600">
              You can browse available doctors below. Sign in to choose a time and confirm your urgent visit.
            </p>
            <Link
              to={loginHref}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in as patient
            </Link>
          </div>
        ) : null}

        {emergencyDoctors.length > 0 ? (
          <p className="mb-4 text-sm text-slate-600">
            Showing {emergencyDoctors.length} doctor{emergencyDoctors.length === 1 ? "" : "s"} with emergency or
            urgent-care specialties first.
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-rose-600" aria-label="Loading doctors" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
            <p className="font-medium text-slate-800">No doctors available right now</p>
            <p className="mt-1 text-sm text-slate-600">Try again shortly or contact emergency services if needed.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <li key={doctor._id}>
                <DoctorCard
                  doctor={doctor}
                  selected={selectedDoctorId === doctor._id}
                  emergency
                  onBook={() => {
                    if (!signedIn) return;
                    setSelectedDoctorId(doctor._id);
                    setBookingDoctor(doctor);
                  }}
                />
                {!signedIn ? (
                  <p className="mt-2 text-center text-xs text-slate-500">Sign in to book with this doctor</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {bookingDoctor && signedIn ? (
        <BookAppointmentPanel
          doctor={bookingDoctor}
          emergency
          onClose={() => {
            setBookingDoctor(null);
            setSelectedDoctorId(null);
          }}
          onBooked={() => {
            setBookingDoctor(null);
            setSelectedDoctorId(null);
          }}
        />
      ) : null}
    </div>
  );
}
