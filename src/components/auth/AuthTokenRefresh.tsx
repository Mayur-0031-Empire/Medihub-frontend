import { refreshAuthToken } from "@/lib/api";
import { bootstrapSession } from "@/lib/auth/bootstrapSession";
import { getAccessToken } from "@/lib/auth";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Refresh access token on this cadence while the user has an active session. */
export const AUTH_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Restores session once on app load and refreshes tokens periodically for signed-in users.
 */
export function AuthTokenRefresh() {
  const { pathname } = useLocation();

  useEffect(() => {
    void bootstrapSession();
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) {
      return;
    }

    const runRefresh = () => {
      if (!getAccessToken()) return;
      void refreshAuthToken();
    };

    runRefresh();
    const intervalId = window.setInterval(runRefresh, AUTH_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [pathname]);

  return null;
}
