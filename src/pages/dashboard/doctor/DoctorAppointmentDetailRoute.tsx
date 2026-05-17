import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";
import { DoctorAppointmentDetailPage } from "./DoctorAppointmentDetailPage";

export function DoctorAppointmentDetailRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "doctor") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <DoctorAppointmentDetailPage />;
}
