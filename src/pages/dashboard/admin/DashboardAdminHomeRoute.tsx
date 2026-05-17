import { dashboardHomePath } from "@/lib/dashboardPaths";
import { Navigate, useOutletContext } from "react-router-dom";
import { AdminDashboardHome } from "./AdminDashboardHome";
import type { DashboardOutletContext } from "../context/outletContext";

export function DashboardAdminHomeRoute() {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== "admin") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <AdminDashboardHome />;
}
