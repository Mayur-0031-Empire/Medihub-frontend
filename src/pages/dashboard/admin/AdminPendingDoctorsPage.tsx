import { PendingDoctorCard } from "@/components/admin/PendingDoctorCard";
import {fetchAdminPendingDoctors, isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import type { PendingDoctorProfile } from "@/types/admin";
import { Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function AdminPendingDoctorsPage() {
  const serverOk = isServerConfigured();
  const [doctors, setDoctors] = useState<PendingDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serverOk) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAdminPendingDoctors();
      setDoctors(rows);
    } catch (e) {
      setError(userFacingError(e, "Could not load pending doctors."));
    } finally {
      setLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleVerified(profileId: string) {
    setDoctors((prev) => prev.filter((d) => d._id !== profileId));
    void load();
  }

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">Pending doctors</h1>
        <p className="mt-2 text-sm">{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/dashboard/admin" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to admin home
      </Link>
      <div className="mt-4 flex items-start gap-3">
        <ShieldCheck className="h-8 w-8 shrink-0 text-violet-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Pending doctors</h1>
          <p className="mt-1 text-slate-600">
            Review submitted profiles and qualification documents. Verify to publish on the public directory, or reject
            with feedback.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading" />
        </div>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && doctors.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
          <p className="mt-3 font-medium text-slate-800">No pending verifications</p>
          <p className="mt-1 text-sm text-slate-600">New doctor submissions will appear here for review.</p>
        </div>
      ) : null}

      {!loading && doctors.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-6">
          {doctors.map((profile) => (
            <li key={profile._id}>
              <PendingDoctorCard profile={profile} onVerified={() => handleVerified(profile._id)} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
