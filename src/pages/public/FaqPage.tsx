const questions = [
  ["How do I book a doctor?", "Sign in as a patient, open appointments, search verified doctors, choose a slot, and confirm the booking."],
  ["Can doctors manage online consultations?", "Yes. Doctors can open booked visits, join video consultation rooms, add notes, share files, and generate draft prescriptions."],
  ["Where are prescriptions and files stored?", "Patients can view doctor-shared files and approved prescriptions from visit documents and appointment details."],
  ["Can I use MediHub without registering?", "Public pages, hospital tools, and basic information are available before login. Booking and records require an account."],
  ["Who can write reviews?", "Logged-in patients can submit reviews about doctors or hospitals. Public visitors can read reviews."],
  ["What happens before an online consultation?", "MediHub can send email reminders to the patient and doctor 15 minutes before the appointment time when SMTP is configured."],
  ["Is AI assistant medical advice?", "The assistant provides general wellness information. It does not replace a doctor, diagnosis, or emergency care."],
];

export function FaqPage() {
  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Recently asked questions</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">Answers about doctors, patients, and MediHub services.</h1>
        <div className="mt-8 space-y-3">
          {questions.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900">
              <summary className="cursor-pointer text-base font-semibold text-slate-900 marker:text-teal-700 dark:text-white">{q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
