import { normalizePortalRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useLayoutEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * `/register` — redirects to `/register/patient` or `/register/:portal` when `?portal=` is present (legacy).
 */
export function RegisterEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useLayoutEffect(() => {
    const p = normalizePortalRole(searchParams.get("portal"));
    navigate(p ? `/register/${p}` : "/register/patient", { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-label="Redirecting" />
    </div>
  );
}
