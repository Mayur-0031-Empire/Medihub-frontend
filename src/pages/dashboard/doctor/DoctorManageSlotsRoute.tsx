import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import { DoctorManageSlotsPage } from "./DoctorManageSlotsPage";
import type { DashboardOutletContext } from "../context/outletContext";

export function DoctorManageSlotsRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "doctor") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <DoctorManageSlotsPage />;
}
