import { submitContactQuery, userFacingError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import { Mail, MessageSquare } from "lucide-react";
import { useState, type FormEvent } from "react";

export function ContactPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactQuery({ name, username, question });
      setName("");
      setUsername("");
      setQuestion("");
      notifySuccess("Your query was submitted.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not submit your query."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Contact us</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">Tell us what you need from MediHub.</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Send questions about doctors, appointments, online consultation, records, reviews, or platform support.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-teal-700" /> Support team replies through configured email.</p>
            <p className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-teal-700" /> Include your username if you already have an account.</p>
          </div>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-500" required />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-500" required />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Your query or question
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-500" required />
          </label>
          <button disabled={submitting} className="mt-5 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 disabled:opacity-60">
            {submitting ? "Sending..." : "Send query"}
          </button>
        </form>
      </section>
    </div>
  );
}
