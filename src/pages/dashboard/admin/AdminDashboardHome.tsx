import { AdminDashboardCharts } from "@/components/dashboard/AdminDashboardCharts";
import { displayName } from "@/lib/user/displayName";
import { CalendarPlus, ClipboardList, MapPinned, ShieldCheck, UserRound } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

const cardClass =
  "flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md";

export function AdminDashboardHome() {
  const { user } = useOutletContext<DashboardOutletContext>();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin console</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-900">
          Administrator
        </span>
      </div>
      <p className="mt-2 text-slate-600">
        Signed in as <span className="font-medium text-slate-900">{displayName(user)}</span>. Review doctor
        submissions and monitor appointments.
      </p>

      <AdminDashboardCharts />

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Administration</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link to="/dashboard/admin/pending-doctors" className={cardClass}>
            <ShieldCheck className="h-8 w-8 text-violet-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Pending doctors</span>
            <span className="mt-1 text-sm text-slate-600">
              Review qualification documents and verify or reject doctor profiles.
            </span>
          </Link>
          <Link to="/dashboard/admin/manage-slots" className={cardClass}>
            <CalendarPlus className="h-8 w-8 text-violet-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Manage doctor slots</span>
            <span className="mt-1 text-sm text-slate-600">
              Add open times per day so patients can book (fixes &quot;no open slots&quot;).
            </span>
          </Link>
          <Link to="/dashboard/admin/appointments" className={cardClass}>
            <ClipboardList className="h-8 w-8 text-violet-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Doctor ↔ patient bookings</span>
            <span className="mt-1 text-sm text-slate-600">See which patient is scheduled with which doctor.</span>
          </Link>
          <Link to="/dashboard/admin/profile" className={cardClass}>
            <UserRound className="h-8 w-8 text-violet-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Account profile</span>
            <span className="mt-1 text-sm text-slate-600">Update your name, contact info, photo, and password.</span>
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link to="/dashboard/hospital-locator" className={cardClass}>
            <MapPinned className="h-8 w-8 text-teal-600" aria-hidden />
            <span className="mt-3 font-semibold text-slate-900">Hospital locator</span>
            <span className="mt-1 text-sm text-slate-600">Find nearby hospitals and map details.</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
