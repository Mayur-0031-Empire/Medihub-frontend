import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";
import { DoctorConsultPage } from "./DoctorConsultPage";

export function DoctorConsultRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "doctor") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <DoctorConsultPage />;
}
