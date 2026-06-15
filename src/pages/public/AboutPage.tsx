import { Link } from "react-router-dom";
import { HeartPulse, Lightbulb, Target } from "lucide-react";

const founders = [
  { name: "Founder 1", role: "Founder", text: "Leads product vision and keeps MediHub focused on practical patient access." },
  { name: "Co-founder 2", role: "Co-founder", text: "Shapes clinical workflows so doctors can move quickly without losing context." },
  { name: "Co-founder 3", role: "Co-founder", text: "Builds the care experience across appointments, records, and communication." },
  { name: "Co-founder 4", role: "Co-founder", text: "Drives platform reliability, data flows, and AI-assisted care tooling." },
];

const platformReviews = [
  "MediHub made booking and joining a video consultation feel simple.",
  "The patient record flow is clear and saved time before my appointment.",
  "I liked having doctor files, prescriptions, and reminders in one place.",
];

export function AboutPage() {
  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">About us</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Building calmer digital care for patients, doctors, and hospitals.
        </h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: Lightbulb, title: "Problem statement", text: "Healthcare journeys are scattered across calls, files, reminders, and disconnected tools. Patients lose clarity and doctors lose time." },
            { icon: Target, title: "Our mission", text: "MediHub brings booking, online consultation, records, notifications, and AI assistance into one simple care workspace." },
            { icon: HeartPulse, title: "Care principle", text: "Technology should reduce friction, not replace clinical judgment. The platform supports people while clinicians stay in control." },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-slate-700 dark:bg-slate-900">
              <Icon className="h-6 w-6 text-teal-700" />
              <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Founding team</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {founders.map((person) => (
            <article key={person.name} className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 font-bold text-teal-800">{person.name[0]}</div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{person.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{person.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{person.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 lg:px-8">
        <div className="rounded-3xl border border-teal-100 bg-white/80 p-6 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-teal-900 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What people say about MediHub</h2>
            <Link to="/reviews" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">View reviews</Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {platformReviews.map((review) => (
              <blockquote key={review} className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                "{review}"
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
