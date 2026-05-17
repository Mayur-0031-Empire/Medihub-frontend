import type { PortalRole } from "@/types/auth";
import { registerPathForRole } from "@/lib/auth";
import { ArrowRight, Heart, Shield, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

const portals: {
  id: PortalRole;
  title: string;
  blurb: string;
  icon: typeof Heart;
  accent: string;
}[] = [
  {
    id: "patient",
    title: "Patients",
    blurb: "Book visits, manage reports, BMI tools, and your AI care assistant.",
    icon: Heart,
    accent: "from-rose-500/15 to-teal-500/10 ring-rose-200/60",
  },
  {
    id: "doctor",
    title: "Doctors",
    blurb: "Schedules, consultations, clinical notes, and patient workflows.",
    icon: Stethoscope,
    accent: "from-teal-500/15 to-cyan-500/10 ring-teal-300/70",
  },
  {
    id: "admin",
    title: "Administrators",
    blurb: "Verify providers, oversee access, and keep the network trusted.",
    icon: Shield,
    accent: "from-slate-500/15 to-teal-500/10 ring-slate-300/70",
  },
];

export function PortalsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Register for your role
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Each account type has its own registration flow. Doctors add practice details during signup.
        </p>
      </div>
      <ul className="mt-10 grid gap-5 sm:grid-cols-3">
        {portals.map(({ id, title, blurb, icon: Icon, accent }) => (
          <li key={id}>
            <div
              className={`flex h-full flex-col rounded-2xl border border-slate-200/90 bg-gradient-to-br p-6 shadow-md ring-1 ring-inset dark:border-slate-700 ${accent}`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-teal-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{blurb}</p>
              <Link
                to={registerPathForRole(id)}
                className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-teal-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Register as {id}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
