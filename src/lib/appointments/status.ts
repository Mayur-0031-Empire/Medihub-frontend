export function isAppointmentCancelled(status: string | undefined): boolean {
  return (status ?? "").toLowerCase().includes("cancel");
}

/** Tailwind classes for appointment status chips (shared by StatusBadge). */
export function appointmentStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "bg-slate-100 text-slate-700 border-transparent";
  if (s.includes("complete") || s.includes("done")) return "bg-emerald-50 text-emerald-800 border-transparent";
  if (s.includes("confirm") || s.includes("book") || s.includes("sched")) {
    return "bg-teal-50 text-teal-800 border-transparent";
  }
  return "bg-amber-50 text-amber-900 border-transparent";
}
