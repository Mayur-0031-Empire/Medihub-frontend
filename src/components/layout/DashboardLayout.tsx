import { Logo } from "@/components/brand/Logo";
import { DoctorNotificationBell } from "@/components/doctor/DoctorNotificationBell";
import { PatientNotificationBell } from "@/components/patient/PatientNotificationBell";
import { PageLoader } from "@/components/common/PageLoader";
import { DashboardSidebarNav, sidebarMenuMeta } from "@/components/layout/DashboardSidebarNav";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDoctorNotifications } from "@/hooks/useDoctorNotifications";
import { fetchCurrentUser, logout, userFacingError } from "@/lib/api";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { sidebarItemsForRole } from "@/lib/dashboard/sidebarItems";
import type { User } from "@/types/auth";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";
import { LogOut, Menu, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

const headerLinkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

function isConnectionOrConfigMessage(message: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("not configured") ||
    m.includes(".env") ||
    m.includes("unable to reach") ||
    m.includes("cors") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed")
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    const me = await fetchCurrentUser();
    setUser(me);
  }, []);

  const outletContext = useMemo((): DashboardOutletContext | null => {
    if (!user) return null;
    return { user, setUser, refreshUser };
  }, [user, refreshUser]);

  const sidebarNav = useMemo(() => (user ? sidebarItemsForRole(user.role) : []), [user]);
  const menuMeta = useMemo(() => (user ? sidebarMenuMeta(user) : { title: "", hint: "" }), [user]);
  const isDoctorRole = user?.role === "doctor";
  const { unreadCount: doctorUnread } = useDoctorNotifications(Boolean(isDoctorRole && user));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (!cancelled) {
          setUser(me);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(userFacingError(e, "Not signed in."));
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* still leave dashboard */
    }
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <PageLoader label="Loading dashboard…" />
      </div>
    );
  }

  if (error || !user) {
    if (!isConnectionOrConfigMessage(error)) {
      const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
      return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
    }
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-4 dark:bg-slate-950">
        <p className="max-w-md text-center text-slate-700 dark:text-slate-300">{error ?? "Session expired."}</p>
        <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400">
          Back to sign in
        </Link>
      </div>
    );
  }

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/dashboard") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }

  const homePath = dashboardHomePath(user.role);
  const isPatient = user.role === "patient";
  const isDoctor = user.role === "doctor";

  const settingsFooter = (
    <button
      type="button"
      onClick={() => {
        setMobileNavOpen(false);
        setSettingsOpen(true);
      }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Settings className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
      Settings
    </button>
  );

  const sidebar = (
    <DashboardSidebarNav
      items={sidebarNav}
      menuTitle={menuMeta.title}
      menuHint={menuMeta.hint}
      isDoctor={isDoctor}
      doctorUnread={doctorUnread}
      onNavigate={() => setMobileNavOpen(false)}
      footer={settingsFooter}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <Logo to={homePath} size="sm" linkAriaLabel="Dashboard home" />
            <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-700" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Dashboard
              </p>
              <p className="truncate text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{user.role} portal</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {isDoctor ? <DoctorNotificationBell /> : null}
            {isPatient ? <PatientNotificationBell /> : null}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="hidden rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5" aria-hidden />
            </button>
            <Link to={`/login?portal=${user.role}`} className={`hidden sm:inline-flex ${headerLinkClass}`}>
              Use another account
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
          <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-hidden sm:top-16 sm:max-h-[calc(100dvh-4rem)]">
            {sidebar}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <Outlet context={outletContext} />
        </main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col gap-0 p-0 lg:hidden">
          {sidebar}
        </SheetContent>
      </Sheet>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
