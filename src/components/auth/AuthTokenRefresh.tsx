import { refreshAuthToken } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Refresh access token on this cadence while the user has an active session. */
export const AUTH_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

function hasActiveSession(pathname: string): boolean {
  if (getAccessToken()) return true;
  return pathname.startsWith("/dashboard");
}

/**
 * Keeps the Bearer access token fresh by calling `POST /api/auth/refresh` every 15 minutes.
 * Relies on the HttpOnly refresh cookie set at login (`credentials: "include"`).
 */
export function AuthTokenRefresh() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!hasActiveSession(pathname)) {
      return;
    }

    const runRefresh = () => {
      if (!hasActiveSession(window.location.pathname)) return;
      void refreshAuthToken();
    };

    runRefresh();
    const intervalId = window.setInterval(runRefresh, AUTH_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [pathname]);

  return null;
}
