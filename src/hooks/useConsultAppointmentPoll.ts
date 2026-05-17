import { fetchAppointmentById } from "@/lib/api";
import type { AppointmentDetail } from "@/types/appointment";
import { useEffect, useRef } from "react";

/** Refresh appointment during live consult so prescriptions and uploads stay in sync. */
export function useConsultAppointmentPoll(
  appointmentId: string | undefined,
  enabled: boolean,
  onUpdate: (detail: AppointmentDetail) => void,
  intervalMs = 8_000,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!appointmentId || !enabled) return;
    const apptId: string = appointmentId;

    let cancelled = false;

    async function tick() {
      try {
        const detail = await fetchAppointmentById(apptId);
        if (!cancelled) onUpdateRef.current(detail);
      } catch {
        /* polling is best-effort */
      }
    }

    void tick();
    const handle = window.setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [appointmentId, enabled, intervalMs]);
}
