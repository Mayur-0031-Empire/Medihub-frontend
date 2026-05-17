import { tabActive, tabInactive } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export const dashboardNavLinkClass =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";

export function dashboardNavClassName({ isActive }: { isActive: boolean }): string {
  return cn(dashboardNavLinkClass, isActive ? cn(tabActive, "shadow-md shadow-teal-600/20") : tabInactive);
}

export type DashboardSidebarItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

type DashboardSidebarNavProps = {
  items: DashboardSidebarItem[];
  menuTitle: string;
  menuHint: string;
  isDoctor?: boolean;
  doctorUnread?: number;
  onNavigate?: () => void;
  footer?: ReactNode;
};

export function DashboardSidebarNav({
  items,
  menuTitle,
  menuHint,
  isDoctor,
  doctorUnread = 0,
  onNavigate,
  footer,
}: DashboardSidebarNavProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{menuTitle}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{menuHint}</p>
        <nav className="mt-5 flex flex-col gap-1" aria-label="Dashboard features">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end === true}
              className={dashboardNavClassName}
              onClick={onNavigate}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              <span className="flex-1">{label}</span>
              {isDoctor && to === "/dashboard/doctor/notifications" && doctorUnread > 0 ? (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {doctorUnread > 9 ? "9+" : doctorUnread}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </div>
      {footer ? <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-700">{footer}</div> : null}
    </div>
  );
}

export function sidebarMenuMeta(user: User): { title: string; hint: string } {
  if (user.role === "patient") {
    return {
      title: "Patient menu",
      hint: "Jump to your profile, bookings, chatbot, and hospital search.",
    };
  }
  if (user.role === "admin") {
    return {
      title: "Admin menu",
      hint: "Verify doctors, review appointments, and manage your admin account.",
    };
  }
  if (user.role === "doctor") {
    return {
      title: "Doctor menu",
      hint: "Profile, schedule, patient visits, and notifications.",
    };
  }
  return {
    title: "Tools & services",
    hint: "Same shortcuts for every portal; your role controls data on the server.",
  };
}
