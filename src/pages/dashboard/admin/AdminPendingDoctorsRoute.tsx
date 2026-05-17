import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import { AdminPendingDoctorsPage } from "./AdminPendingDoctorsPage";
import type { DashboardOutletContext } from "../context/outletContext";

export function AdminPendingDoctorsRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "admin") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <AdminPendingDoctorsPage />;
}
