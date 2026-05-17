import { HomeNetworkDashboard } from "@/components/public/HomeNetworkDashboard";
import { publicFeatures } from "@/lib/public/features";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-slate-400/20 blur-3xl"
        aria-hidden
      />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:py-12 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">MediHub</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Your health platform at a glance
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Pick a feature to get started, then scroll down for live network charts — each with its own date control to
          explore historical data.
        </p>
      </section>

      <section className="relative z-10 py-4 sm:py-6">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Explore features</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Tools and registration — each on its own page.</p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publicFeatures.map(({ id, title, description, path, icon: Icon, accent }) => (
              <li key={id}>
                <Link
                  to={path}
                  className={`group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-gradient-to-br p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 ${accent}`}
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-teal-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 group-hover:gap-2 dark:text-teal-400">
                    Open
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative z-10 border-t border-slate-200/80 bg-white/50 py-12 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40 sm:py-14">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <HomeNetworkDashboard />
        </div>
      </section>
    </div>
  );
}
