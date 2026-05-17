import { dashboardHomePath } from "@/lib/dashboardPaths";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";
import type { UserRole } from "@/types/auth";
import type { ReactNode } from "react";
import { Navigate, useOutletContext } from "react-router-dom";

type DashboardRoleGateProps = {
  allow: UserRole[];
  children: ReactNode;
};

/** Redirects users outside `allow` to their role home (e.g. doctors away from patient-only tools). */
export function DashboardRoleGate({ allow, children }: DashboardRoleGateProps) {
  const { user } = useOutletContext<DashboardOutletContext>();
  if (!allow.includes(user.role)) {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }
  return children;
}
