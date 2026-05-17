import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";
import { PatientConsultPage } from "./PatientConsultPage";

export function PatientConsultRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "patient") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <PatientConsultPage />;
}
