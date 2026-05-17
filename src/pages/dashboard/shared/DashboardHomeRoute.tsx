import { dashboardHomePath } from "@/lib/dashboardPaths";
import type { UserRole } from "@/types/auth";
import { Navigate, useOutletContext } from "react-router-dom";
import { DashboardHomePage } from "./DashboardHomePage";
import type { DashboardOutletContext } from "../context/outletContext";

interface DashboardHomeRouteProps {
  forRole: UserRole;
}

export function DashboardHomeRoute({ forRole }: DashboardHomeRouteProps) {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (user.role !== forRole) {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return <DashboardHomePage />;
}
