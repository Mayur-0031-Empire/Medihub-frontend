import { dashboardHomePath } from "@/lib/dashboardPaths";
import type { User } from "@/types/auth";
import type { DashboardSidebarItem } from "@/components/layout/DashboardSidebarNav";
import {
  Activity,
  Bell,
  CalendarPlus,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Brain,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

export function sidebarItemsForRole(role: User["role"]): DashboardSidebarItem[] {
  if (role === "patient") {
    const home = dashboardHomePath("patient");
    return [
      { to: home, label: "Home", icon: LayoutDashboard, end: true },
      { to: "/dashboard/patient/profile", label: "Profile", icon: UserRound },
      { to: "/dashboard/bmi-buddy", label: "BMI Buddy", icon: Activity },
      { to: "/dashboard/patient/appointments", label: "Appointment booking", icon: CalendarPlus },
      { to: "/dashboard/patient/notifications", label: "Notifications", icon: Bell },
      { to: "/dashboard/patient/documents", label: "Visit documents", icon: FileText },
      { to: "/dashboard/patient/medical-records", label: "My uploads", icon: FolderOpen },
      { to: "/dashboard/chatbot", label: "Chatbot", icon: MessageSquare },
      { to: "/dashboard/stress-monitor", label: "Stress monitor", icon: Brain },
      { to: "/dashboard/hospital-locator", label: "Hospital locator", icon: MapPinned },
    ];
  }

  const home = dashboardHomePath(role);
  if (role === "admin") {
    return [
      { to: home, label: "Admin home", icon: LayoutDashboard, end: true },
      { to: "/dashboard/admin/pending-doctors", label: "Pending doctors", icon: ShieldCheck },
      { to: "/dashboard/admin/manage-slots", label: "Manage slots", icon: CalendarPlus },
      { to: "/dashboard/admin/appointments", label: "Bookings", icon: ClipboardList },
      { to: "/dashboard/admin/profile", label: "Account profile", icon: UserRound },
      { to: "/dashboard/hospital-locator", label: "Hospital locator", icon: MapPinned },
    ];
  }
  if (role === "doctor") {
    return [
      { to: home, label: "Workspace", icon: LayoutDashboard, end: true },
      { to: "/dashboard/doctor-profile", label: "Professional profile", icon: Stethoscope },
      { to: "/dashboard/doctor/slots", label: "Manage slots", icon: CalendarPlus },
      { to: "/dashboard/doctor/appointments", label: "Appointments", icon: ClipboardList },
      { to: "/dashboard/doctor/notifications", label: "Notifications", icon: Bell },
      { to: "/dashboard/stress-monitor", label: "Stress monitor", icon: Brain },
    ];
  }
  return [
    { to: home, label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/chatbot", label: "AI chatbot", icon: MessageSquare },
    { to: "/dashboard/stress-monitor", label: "Stress monitor", icon: Brain },
    { to: "/dashboard/bmi-buddy", label: "BMI Buddy", icon: Activity },
    { to: "/dashboard/hospital-locator", label: "Hospital locator", icon: MapPinned },
    { to: "/dashboard/patient-services", label: "Patient services", icon: ClipboardList },
  ];
}
