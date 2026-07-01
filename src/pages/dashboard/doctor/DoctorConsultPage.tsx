import { ConsultStressPanel } from "@/components/eeg/ConsultStressPanel";
import { VideoConsultRoom } from "@/components/consult/VideoConsultRoom";
import { DoctorConsultClinicalPanel } from "@/components/doctor/DoctorConsultClinicalPanel";
import { useConsultAppointmentPoll } from "@/hooks/useConsultAppointmentPoll";
import { useConsultationTranscription } from "@/hooks/useConsultationTranscription";
import {fetchAppointmentById, isServerConfigured, updateDoctorAppointmentNotes, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { formatSlotRange, patientDisplayName } from "@/lib/appointments";
import { clearTranscriptDraft } from "@/lib/consult/transcriptDraft";
import type { AppointmentDetail } from "@/types/appointment";
import { iconBrand, linkBrand, surfaceCard, textBody, textHeading, textSubtle } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function DoctorConsultPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const serverOk = isServerConfigured();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callConnected, setCallConnected] = useState(false);
  const [refreshingAppt, setRefreshingAppt] = useState(false);

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

  useConsultAppointmentPoll(appointmentId, Boolean(appt) && !loading && callConnected, setAppt);

  const refreshAppt = useCallback(async () => {
    if (!appointmentId) return;
    setRefreshingAppt(true);
    try {
      setAppt(await fetchAppointmentById(appointmentId));
    } catch {
      /* ignore */
    } finally {
      setRefreshingAppt(false);
    }
  }, [appointmentId]);

  const transcription = useConsultationTranscription({
    active: callConnected,
    appointmentId: appointmentId ?? "",
    initialText: appt?.meetingTranscript ?? "",
  });

  const transcriptRef = useRef(transcription.transcript);
  useEffect(() => {
    transcriptRef.current = transcription.transcript;
  }, [transcription.transcript]);

  const flushTranscript = useCallback(async () => {
    if (!appointmentId) return;
    const text = transcriptRef.current.trim();
    if (!text) return;
    try {
      await updateDoctorAppointmentNotes(appointmentId, { meetingTranscript: text });
    } catch {
      /* best-effort on leave */
    }
  }, [appointmentId]);

  const handleBeforeLeave = useCallback(async () => {
    transcription.stop();
    await flushTranscript();
    if (appointmentId) clearTranscriptDraft(appointmentId);
  }, [appointmentId, flushTranscript, transcription]);

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

  const patientName = appt ? patientDisplayName(appt) : "Patient";

  return (
    <div className="mx-auto max-w-[1600px]">
      <Link
        to={`/dashboard/doctor/appointments/${appointmentId}`}
        className={cn("inline-flex items-center gap-1.5 text-sm", linkBrand)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to appointment
      </Link>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className={cn("h-10 w-10 animate-spin", iconBrand)} aria-label="Loading" />
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : appt ? (
        <>
          <header className={cn("mt-4 flex items-center gap-3 p-5", surfaceCard)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <Video className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className={cn("text-xl font-bold", textHeading)}>Video consultation</h1>
              <p className={cn("text-sm", textBody)}>
                {patientName}
                {appt.startAt ? ` · ${formatSlotRange(appt.startAt, appt.endAt)}` : ""}
              </p>
              <p className={cn("mt-1 text-xs", textSubtle)}>
                Patient video on the left. When the call is live, the right panel includes transcript, patient MRI/X-ray
                uploads, and AI scan analysis.
              </p>
            </div>
          </header>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:items-start">
            <div className="space-y-4">
              <VideoConsultRoom
                appointmentId={appointmentId}
                role="doctor"
                peerLabel={patientName}
                stageClassName="min-h-[min(52vh,520px)] xl:min-h-[min(72vh,680px)]"
                onConnectionChange={setCallConnected}
                onBeforeLeave={handleBeforeLeave}
              />
              <ConsultStressPanel appointmentId={appointmentId} role="doctor" live={callConnected} />
            </div>
            <DoctorConsultClinicalPanel
              appointmentId={appointmentId}
              appt={appt}
              onApptChange={setAppt}
              transcript={transcription.transcript}
              onTranscriptChange={transcription.setTranscript}
              transcription={transcription}
              persistTranscriptWhileLive={callConnected}
              liveConsult={callConnected}
              onRefreshAppt={() => void refreshAppt()}
              refreshingAppt={refreshingAppt}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
