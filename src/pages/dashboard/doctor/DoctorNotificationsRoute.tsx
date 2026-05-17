import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";
import { DoctorNotificationsPage } from "./DoctorNotificationsPage";

export function DoctorNotificationsRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "doctor") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <DoctorNotificationsPage />;
}
