import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import { AdminAppointmentsPage } from "./AdminAppointmentsPage";
import type { DashboardOutletContext } from "../context/outletContext";

export function AdminAppointmentsRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "admin") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <AdminAppointmentsPage />;
}
