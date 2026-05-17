import { fetchCurrentUser, isServerConfigured, userFacingError } from "@/lib/api";
import { sanitizeUserFacingMessage } from "@/lib/userMessages";
import { extractAccessTokenFromUrl, setAccessToken } from "@/lib/auth";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign-in…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error") ?? searchParams.get("oauth_error");
    const errDesc = searchParams.get("error_description") ?? searchParams.get("message");
    if (err) {
      setError(
        sanitizeUserFacingMessage(
          errDesc ? `${err}: ${errDesc}` : err,
          "Sign-in could not be completed. Please try again later.",
        ),
      );
      setMessage("");
      return;
    }

    if (!isServerConfigured()) {
      setError("Sign-in could not be completed. Please try again later.");
      setMessage("");
      return;
    }

    const urlToken = extractAccessTokenFromUrl(searchParams, window.location.hash ?? "");
    if (urlToken) {
      setAccessToken(urlToken);
      const clean = new URL(window.location.href);
      for (const k of ["access_token", "accessToken", "token", "jwt", "id_token"]) {
        clean.searchParams.delete(k);
      }
      if (clean.hash && /access_token|accessToken|token|jwt|id_token/i.test(clean.hash)) {
        clean.hash = "";
      }
      window.history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);
    }

    let cancelled = false;
    (async () => {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) navigate(dashboardHomePath(user.role), { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError(userFacingError(e, "Could not verify session."));
          setMessage("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        {message && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-hidden />
            <p className="text-slate-700">{message}</p>
          </div>
        )}
        {error && (
          <div role="alert" className="text-left">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <Link
              to="/login"
              className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
