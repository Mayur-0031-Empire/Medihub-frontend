import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { displayName } from "@/lib/user/displayName";
import { PatientVisitDocumentsPreview } from "@/components/patient/PatientVisitDocumentsPreview";
import { usePatientNotifications } from "@/hooks/usePatientNotifications";
import { Activity, Bell, CalendarPlus, FileText, FolderOpen, MapPinned, MessageSquare, UserRound } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

const shortcuts = [
  {
    to: "/dashboard/patient/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Visits, prescriptions, and files from your doctor.",
  },
  {
    to: "/dashboard/patient/profile",
    icon: UserRound,
    title: "Profile",
    description: "View and update your account details.",
  },
  {
    to: "/dashboard/patient/appointments",
    icon: CalendarPlus,
    title: "Appointment booking",
    description: "Book visits, view prescriptions, and upload medical records for your doctor.",
  },
  {
    to: "/dashboard/patient/documents",
    icon: FileText,
    title: "Visit documents",
    description: "Prescriptions and files from your doctor, organized per visit.",
  },
  {
    to: "/dashboard/patient/medical-records",
    icon: FolderOpen,
    title: "My uploads",
    description: "MRI, lab reports, and scans you uploaded for each appointment.",
  },
  {
    to: "/dashboard/bmi-buddy",
    icon: Activity,
    title: "BMI Buddy",
    description: "Enter height and weight, then see your category, scale indicator, and wellness tips.",
  },
  {
    to: "/dashboard/chatbot",
    icon: MessageSquare,
    title: "Chatbot",
    description: "Ask health questions and get guided answers.",
  },
  {
    to: "/dashboard/hospital-locator",
    icon: MapPinned,
    title: "Hospital locator",
    description: "Find facilities and directions near you.",
  },
] as const;

export function PatientDashboardHome() {
  const { user } = useOutletContext<DashboardOutletContext>();
  const name = displayName(user);
  const { unreadCount } = usePatientNotifications(true);

  return (
    <div className="mx-auto max-w-3xl animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back</h1>
      <p className="mt-2 text-slate-600">
        Signed in as <span className="font-medium text-slate-900">{name}</span>. Use the sidebar or shortcuts below.
      </p>

      {unreadCount > 0 ? (
        <Link
          to="/dashboard/patient/notifications"
          className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 hover:bg-amber-100"
        >
          <Bell className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            You have <strong>{unreadCount}</strong> unread notification{unreadCount === 1 ? "" : "s"}
          </span>
        </Link>
      ) : null}

      <PatientVisitDocumentsPreview />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {shortcuts.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to} className="group block">
            <Card className="h-full border-slate-200 transition hover:border-teal-200 hover:shadow-md">
              <CardHeader>
                <Icon className="h-8 w-8 text-primary" aria-hidden />
                <CardTitle className="text-slate-900 group-hover:text-teal-900">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
