import { hasCompletedIntro, markIntroComplete } from "@/lib/public/intro";
import { Heart } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SPLASH_MS = 2800;

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCompletedIntro()) {
      navigate("/", { replace: true });
      return;
    }
    const timer = window.setTimeout(() => {
      markIntroComplete();
      navigate("/", { replace: true });
    }, SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-teal-50 via-white to-slate-50 sm:min-h-[calc(100dvh-4rem)] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,184,166,0.18),transparent_55%)]"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <div className="mh-heart-spin relative flex h-28 w-28 items-center justify-center rounded-full bg-teal-600/10 ring-1 ring-teal-500/30">
          <Heart className="h-14 w-14 fill-rose-500 text-rose-500 drop-shadow-sm" aria-hidden />
          <span className="absolute inset-0 rounded-full border-2 border-teal-500/40 border-t-teal-600" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">MediHub</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Care that connects everyone
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">Preparing your experience…</p>
        </div>
      </div>
    </div>
  );
}
