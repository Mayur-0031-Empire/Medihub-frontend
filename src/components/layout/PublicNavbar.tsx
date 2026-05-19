import { Logo } from "@/components/brand/Logo";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { fetchCurrentUser, logout } from "@/lib/api";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { publicFeatures } from "@/lib/public/features";
import type { User } from "@/types/auth";
import { Menu, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navLink =
  "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800";

function navClass({ isActive }: { isActive: boolean }) {
  return cn(navLink, isActive ? "text-teal-700 dark:text-teal-400" : "text-slate-600 dark:text-slate-300");
}

export function PublicNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const homePath = "/";
  const dashboardPath = user ? dashboardHomePath(user.role) : "/dashboard";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetchCurrentUser();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
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
      /* local session is cleared in logout() even if the API call fails */
    }
    setUser(null);
    setMenuOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <>
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Logo to={homePath} size="sm" />
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <NavLink to={homePath} className={navClass} end>
              Home
            </NavLink>
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>
            {!user ? (
              <NavLink to="/portals" className={navClass}>
                Register
              </NavLink>
            ) : null}
            <div className="group relative">
              <span className={cn(navLink, "cursor-default text-slate-600 dark:text-slate-300")}>Features</span>
              <div className="pointer-events-none absolute left-0 top-full z-30 pt-1 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                <ul className="min-w-[14rem] rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {publicFeatures
                    .filter((f) => f.id !== "portals")
                    .map((f) => (
                      <li key={f.id}>
                        <Link
                          to={f.path}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {f.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {user.firstName ? `Hi, ${user.firstName}` : "Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Sign in
                </Link>
                <Link
                  to="/register/patient"
                  className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {menuOpen ? (
          <nav className="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800" aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              <li>
                <NavLink to={homePath} className={navClass} end onClick={() => setMenuOpen(false)}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={navClass} onClick={() => setMenuOpen(false)}>
                  About
                </NavLink>
              </li>
              {!user ? (
                <li>
                  <NavLink to="/portals" className={navClass} onClick={() => setMenuOpen(false)}>
                    Register
                  </NavLink>
                </li>
              ) : null}
              {publicFeatures.map((f) => (
                <li key={f.id}>
                  <Link to={f.path} className={navLink} onClick={() => setMenuOpen(false)}>
                    {f.title}
                  </Link>
                </li>
              ))}
              {user ? (
                <>
                  <li>
                    <Link to={dashboardPath} className={navLink} onClick={() => setMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <button type="button" className={cn(navLink, "text-left")} onClick={() => void handleLogout()}>
                      Sign out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login" className={navLink} onClick={() => setMenuOpen(false)}>
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        ) : null}
      </header>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
