import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";
import { PatientDashboardHome } from "./PatientDashboardHome";

export function DashboardPatientHomeRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "patient") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <PatientDashboardHome />;
}
