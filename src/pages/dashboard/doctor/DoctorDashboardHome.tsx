import { DoctorDashboardCharts } from "@/components/dashboard/DoctorDashboardCharts";
import { useDoctorNotifications } from "@/hooks/useDoctorNotifications";
import { fetchDoctorMe, fetchMyAppointments, isServerConfigured } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { DASHBOARD_WELCOME_QUOTE, dashboardGreeting } from "@/lib/dashboard/welcome";
import {
  Bell,
  CalendarPlus,
  ClipboardList,
  FileText,
  Stethoscope,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

const cardClass =
  "flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md";

export function DoctorDashboardHome() {
  const { user } = useOutletContext<DashboardOutletContext>();
  const serverOk = isServerConfigured();
  const [profileMissing, setProfileMissing] = useState<boolean | null>(null);
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const { unreadCount: unreadNotifications } = useDoctorNotifications(serverOk);

  useEffect(() => {
    if (!serverOk) return;
    let cancelled = false;
    void (async () => {
      try {
        const d = await fetchDoctorMe();
        if (!cancelled) setProfileMissing(d === null);
      } catch {
        if (!cancelled) setProfileMissing(false);
      }
    })();
    void (async () => {
      try {
        const appts = await fetchMyAppointments();
        if (!cancelled) {
          const now = Date.now();
          const upcoming = appts.filter((a) => {
            if (a.status.toLowerCase().includes("cancel")) return false;
            const t = a.startAt ? new Date(a.startAt).getTime() : 0;
            return t >= now - 60 * 60 * 1000;
          });
          setUpcomingCount(upcoming.length);
        }
      } catch {
        if (!cancelled) setUpcomingCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverOk]);

  return (
    <div className="mx-auto max-w-6xl">
      {profileMissing ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Complete your professional profile</p>
          <p className="mt-1">
            Add specialty, hospital, fees, and qualification documents so patients can find and book you.
          </p>
          <Link to="/dashboard/doctor-profile" className="mt-2 inline-block font-semibold text-teal-800 underline">
            Open doctor profile
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{dashboardGreeting(user)}</h1>
        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-900">Doctor</span>
      </div>
      <p className="mt-2 text-slate-600">{DASHBOARD_WELCOME_QUOTE}</p>

      {serverOk ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/dashboard/doctor/appointments"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/50"
          >
            <span className="font-semibold text-slate-900">{upcomingCount ?? "…"}</span> upcoming visit
            {upcomingCount === 1 ? "" : "s"}
          </Link>
          <Link
            to="/dashboard/doctor/notifications"
            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 transition hover:bg-amber-100"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span className="font-semibold">{unreadNotifications}</span> new notification
            {unreadNotifications === 1 ? "" : "s"}
          </Link>
        </div>
      ) : null}

      <DoctorDashboardCharts />

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Clinical workspace</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link to="/dashboard/doctor/appointments" className={cardClass}>
            <ClipboardList className="h-8 w-8 text-teal-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">My appointments</span>
            <span className="mt-1 text-sm text-slate-600">
              View booked visits, add consultation notes, prescriptions, and files.
            </span>
          </Link>
          <Link to="/dashboard/doctor/slots" className={cardClass}>
            <CalendarPlus className="h-8 w-8 text-teal-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Manage slots</span>
            <span className="mt-1 text-sm text-slate-600">Set open times so patients can book with you.</span>
          </Link>
          <Link to="/dashboard/doctor-profile" className={cardClass}>
            <Stethoscope className="h-8 w-8 text-teal-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Professional profile</span>
            <span className="mt-1 text-sm text-slate-600">
              Specialty, hospital, fees, schedule, and verification documents.
            </span>
          </Link>
          <Link to="/dashboard/doctor/notifications" className={cardClass}>
            <Bell className="h-8 w-8 text-teal-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Notifications</span>
            <span className="mt-1 text-sm text-slate-600">Booking alerts and appointment updates.</span>
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">During a visit</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className={cardClass}>
            <Video className="h-8 w-8 text-teal-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Video consultation</span>
            <span className="mt-1 text-sm text-slate-600">
              Open an appointment, then start a video room for WebRTC consult (Socket.IO signaling).
            </span>
            <Link
              to="/dashboard/doctor/appointments"
              className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Go to appointments →
            </Link>
          </div>
          <Link to="/dashboard/doctor/appointments" className={cardClass}>
            <FileText className="h-8 w-8 text-teal-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">AI prescription</span>
            <span className="mt-1 text-sm text-slate-600">
              Open an appointment to import vitals from a document and generate an AI prescription.
            </span>
          </Link>
        </div>
      </section>

      {!serverOk ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {SERVICE_UNAVAILABLE}
        </p>
      ) : null}
    </div>
  );
}
