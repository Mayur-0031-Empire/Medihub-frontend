import { markIntroComplete } from "@/lib/public/intro";
import { ArrowRight, HeartHandshake, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  {
    icon: HeartHandshake,
    title: "Patient-first journeys",
    text: "Booking, records, and virtual visits designed around real people — not paperwork.",
  },
  {
    icon: Shield,
    title: "Trusted clinical network",
    text: "Verified doctors and admins keep quality high across every interaction.",
  },
  {
    icon: Sparkles,
    title: "Smart tools, human care",
    text: "AI assistance and wellness tools support decisions; clinicians stay in control.",
  },
];

export function AboutPage() {
  function enterHome() {
    markIntroComplete();
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" aria-hidden />
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-14 sm:py-20 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">About MediHub</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Healthcare that feels connected, clear, and calm.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          MediHub brings patients, doctors, and administrators onto one platform — from booking and video consults to
          records, notifications, and network insights. We built it so every role has the right tools without the clutter.
        </p>
        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Explore guest features without signing in, or register for the portal that matches how you deliver or receive care.
        </p>

        <ul className="mt-12 grid gap-5 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-400">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/"
            onClick={enterHome}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700"
          >
            Explore features
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/portals"
            onClick={enterHome}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Register by role
          </Link>
        </div>
      </section>
    </div>
  );
}
