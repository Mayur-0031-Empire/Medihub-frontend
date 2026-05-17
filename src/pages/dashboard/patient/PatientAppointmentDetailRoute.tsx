import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";
import { PatientAppointmentDetailPage } from "./PatientAppointmentDetailPage";

export function PatientAppointmentDetailRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "patient") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <PatientAppointmentDetailPage />;
}
