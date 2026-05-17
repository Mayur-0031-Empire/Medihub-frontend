import { ConsultPatientSidebar } from "@/components/consult/ConsultPatientSidebar";
import { VideoConsultRoom } from "@/components/consult/VideoConsultRoom";
import { useConsultAppointmentPoll } from "@/hooks/useConsultAppointmentPoll";
import {fetchAppointmentById, isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { formatSlotRange } from "@/lib/appointments";
import type { AppointmentDetail } from "@/types/appointment";
import { iconBrand, linkBrand, surfaceCard, textBody, textHeading, textSubtle } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function PatientConsultPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const serverOk = isServerConfigured();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!serverOk || !appointmentId) return;
    setLoading(true);
    try {
      setAppt(await fetchAppointmentById(appointmentId));
    } catch (e) {
      setError(userFacingError(e, "Could not load appointment."));
    } finally {
      setLoading(false);
    }
  }, [appointmentId, serverOk]);

  useEffect(() => {
    void load();
  }, [load]);

  const manualRefresh = useCallback(async () => {
    if (!appointmentId) return;
    setSyncing(true);
    try {
      setAppt(await fetchAppointmentById(appointmentId));
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
    }
  }, [appointmentId]);

  useConsultAppointmentPoll(appointmentId, Boolean(appt) && !loading, setAppt);

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <p>{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  if (!appointmentId) {
    return <p className="text-red-800">Missing appointment ID.</p>;
  }

  const doctorName = appt?.doctorName ?? "your doctor";

  return (
    <div className="mx-auto max-w-[1600px]">
      <Link
        to={`/dashboard/patient/appointments/${appointmentId}`}
        className={cn("inline-flex items-center gap-1.5 text-sm", linkBrand)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Visit details & records
      </Link>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className={cn("h-10 w-10 animate-spin", iconBrand)} aria-label="Loading" />
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : appt ? (
        <>
          <header className={cn("mt-4 flex flex-wrap items-center gap-3 p-4 sm:p-5", surfaceCard)}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <Video className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className={cn("text-xl font-bold", textHeading)}>Video visit</h1>
              <p className={cn("text-sm", textBody)}>
                With {doctorName}
                {appt.startAt ? ` · ${formatSlotRange(appt.startAt, appt.endAt)}` : ""}
              </p>
              <p className={cn("mt-1 text-xs", textSubtle)}>
                Upload MRI or lab files on the right; your prescription updates when the doctor approves it.
              </p>
            </div>
            <Link
              to="/dashboard/patient/medical-records"
              className={cn("ml-auto text-xs font-semibold hover:underline", linkBrand)}
            >
              All records →
            </Link>
          </header>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:items-start">
            <VideoConsultRoom
              appointmentId={appointmentId}
              role="patient"
              peerLabel={doctorName}
              stageClassName="min-h-[min(52vh,520px)] xl:min-h-[min(72vh,680px)]"
            />
            <ConsultPatientSidebar
              appointmentId={appointmentId}
              appt={appt}
              onUpdated={setAppt}
              syncing={syncing}
              onRefresh={() => void manualRefresh()}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
