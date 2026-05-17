import { fetchDoctorMe } from "@/lib/api";
import { displayName } from "@/lib/user/displayName";
import { Mail, Phone, Shield, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

export function DashboardHomePage() {
  const { user } = useOutletContext<DashboardOutletContext>();
  const [doctorProfileMissing, setDoctorProfileMissing] = useState<boolean | null>(null);

  useEffect(() => {
    if (user.role !== "doctor") {
      setDoctorProfileMissing(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchDoctorMe();
        if (!cancelled) setDoctorProfileMissing(d === null);
      } catch {
        if (!cancelled) setDoctorProfileMissing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  return (
    <div className="mx-auto max-w-2xl">
      {doctorProfileMissing ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-semibold">Complete your professional profile</p>
          <p className="mt-1 text-amber-900/90">
            Add your specialty, practice details, schedule, and qualification documents so patients can find and book
            you.
          </p>
          <Link
            to="/dashboard/doctor-profile"
            className="mt-2 inline-block font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            Open doctor profile form
          </Link>
        </div>
      ) : null}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your profile</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-teal-900">
          <Shield className="h-3.5 w-3.5" aria-hidden />
          {user.role}
        </span>
      </div>
      <p className="text-slate-600">Signed in as {displayName(user)}. Use the tools on the right to move around the app.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-6 py-8 sm:flex sm:items-start sm:gap-6">
          <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 sm:mx-0">
            {user.photo ? (
              <img src={user.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-12 w-12" strokeWidth={1.25} aria-hidden />
            )}
          </div>
          <div className="mt-4 min-w-0 text-center sm:mt-0 sm:text-left">
            <p className="text-xl font-semibold text-slate-900">{displayName(user)}</p>
            {user.username ? <p className="text-sm text-slate-500">@{user.username}</p> : null}
          </div>
        </div>

        <dl className="divide-y divide-slate-100 px-6 py-2 text-sm">
          {user.email ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <dt className="flex items-center gap-2 text-slate-500">
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                Email
              </dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
          ) : null}
          {user.phone ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <dt className="flex items-center gap-2 text-slate-500">
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                Phone
              </dt>
              <dd className="font-medium text-slate-900">{user.phone}</dd>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <dt className="text-slate-500">Account ID</dt>
            <dd className="font-mono text-xs text-slate-700">{user._id}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
