import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import { PatientProfilePage } from "@/pages/dashboard/patient/PatientProfilePage";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";

export function AdminProfileRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "admin") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <PatientProfilePage />;
}
