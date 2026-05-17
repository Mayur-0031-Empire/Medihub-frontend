import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import { AdminManageSlotsPage } from "./AdminManageSlotsPage";
import type { DashboardOutletContext } from "../context/outletContext";

export function AdminManageSlotsRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "admin") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <AdminManageSlotsPage />;
}
