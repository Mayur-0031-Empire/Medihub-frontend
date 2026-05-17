import { AppointmentHistoryList } from "@/components/appointments/AppointmentHistoryList";
import { BookAppointmentPanel } from "@/components/appointments/BookAppointmentPanel";
import { DoctorCard } from "@/components/appointments/DoctorCard";
import { DoctorFiltersPanel } from "@/components/appointments/DoctorFiltersPanel";
import { fetchMyAppointments, fetchPublicDoctors, isServerConfigured, userFacingError } from "@/lib/api";
import { tabActive, tabInactive } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { collectFilterOptions, filterDoctors } from "@/lib/appointments";
import type { PublicDoctorProfile } from "@/types/appointment";
import { DEFAULT_DOCTOR_FILTERS, type DoctorListFilters } from "@/types/appointment";
import { CalendarPlus, ClipboardList, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";
import { useOutletContext } from "react-router-dom";

type TabId = "book" | "history";

export function PatientAppointmentsPage() {
  useOutletContext<DashboardOutletContext>();
  const serverOk = isServerConfigured();
  const [tab, setTab] = useState<TabId>("book");
  const [doctors, setDoctors] = useState<PublicDoctorProfile[]>([]);
  const [appointments, setAppointments] = useState<Awaited<ReturnType<typeof fetchMyAppointments>>>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DoctorListFilters>(DEFAULT_DOCTOR_FILTERS);
  const [searchTitle, setSearchTitle] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState<PublicDoctorProfile | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    if (!serverOk) return;
    setDoctorsLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchPublicDoctors(searchTitle.trim() || undefined);
      setDoctors(rows);
    } catch (e) {
      setLoadError(userFacingError(e, "Could not load doctors."));
    } finally {
      setDoctorsLoading(false);
    }
  }, [serverOk, searchTitle]);

  const loadHistory = useCallback(async () => {
    if (!serverOk) return;
    setHistoryLoading(true);
    try {
      const rows = await fetchMyAppointments();
      setAppointments(rows);
    } catch (e) {
      setLoadError((prev) => prev ?? (userFacingError(e, "Could not load your appointments.")));
    } finally {
      setHistoryLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filterOptions = useMemo(() => collectFilterOptions(doctors), [doctors]);
  const filteredDoctors = useMemo(
    () => filterDoctors(doctors, filters),
    [doctors, filters],
  );

  function handleBooked() {
    void loadHistory();
    setTab("history");
  }

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">Appointments</h1>
        <p className="mt-2 text-sm">{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Appointments</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Find a verified doctor, compare fees and experience, and book a time that works for you.
        </p>
      </header>

      <div
        className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        role="tablist"
        aria-label="Appointment sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "book"}
          onClick={() => setTab("book")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
            tab === "book" ? tabActive : tabInactive,
          )}
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Book a visit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
            tab === "history" ? tabActive : tabInactive,
          )}
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          My appointments
          {appointments.length > 0 ? (
            <span
              className={[
                "rounded-full px-1.5 py-0.5 text-xs",
                tab === "history" ? "bg-white/20" : "bg-slate-100 text-slate-700",
              ].join(" ")}
            >
              {appointments.length}
            </span>
          ) : null}
        </button>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {loadError}
        </div>
      ) : null}

      {tab === "book" ? (
        <>
          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void loadDoctors();
            }}
          >
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-600/15"
                placeholder="Search by speciality (e.g. Cardiology)"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Search
            </button>
          </form>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <DoctorFiltersPanel
              filters={filters}
              specialities={filterOptions.specialities}
              hospitals={filterOptions.hospitals}
              resultCount={filteredDoctors.length}
              onChange={setFilters}
            />
            <section>
              {doctorsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading doctors" />
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                  <p className="font-medium text-slate-800">No doctors match your filters</p>
                  <p className="mt-1 text-sm text-slate-600">Try resetting filters or a different search.</p>
                </div>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {filteredDoctors.map((doctor) => (
                    <li key={doctor._id}>
                      <DoctorCard
                        doctor={doctor}
                        selected={selectedDoctorId === doctor._id}
                        onBook={() => {
                          setSelectedDoctorId(doctor._id);
                          setBookingDoctor(doctor);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : (
        <section>
          {historyLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading appointments" />
            </div>
          ) : (
            <AppointmentHistoryList appointments={appointments} />
          )}
        </section>
      )}

      {bookingDoctor ? (
        <BookAppointmentPanel
          doctor={bookingDoctor}
          onClose={() => {
            setBookingDoctor(null);
            setSelectedDoctorId(null);
          }}
          onBooked={handleBooked}
        />
      ) : null}
    </div>
  );
}
