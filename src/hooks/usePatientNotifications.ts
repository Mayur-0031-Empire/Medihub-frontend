import {
  countUnreadNotifications,
  loadPatientNotifications,
  markAllPatientNotificationsRead,
} from "@/lib/appointments/patientNotifications";
import { isServerConfigured, userFacingError } from "@/lib/api";
import type { AppointmentNotification } from "@/types/appointment";
import { useCallback, useEffect, useState } from "react";

export function usePatientNotifications(enabled = true) {
  const serverOk = isServerConfigured();
  const [items, setItems] = useState<AppointmentNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!serverOk || !enabled) return;
    setLoading(true);
    setError(null);
    setFallbackHint(null);
    try {
      const result = await loadPatientNotifications();
      setItems(result.items);
      if (result.source === "sync" && result.items.length > 0) {
        setFallbackHint("Showing visits with prescriptions, doctor files, and upcoming appointments.");
      }
      if (result.apiError && result.items.length === 0) {
        setError(result.apiError);
      }
    } catch (e) {
      setError(userFacingError(e, "Could not load notifications."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, serverOk]);

  const markAllRead = useCallback(() => {
    markAllPatientNotificationsRead(items);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [items]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return {
    items,
    unreadCount: countUnreadNotifications(items),
    loading,
    error,
    fallbackHint,
    refresh,
    markAllRead,
  };
}
