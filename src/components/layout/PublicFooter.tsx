import { Logo } from "@/components/brand/Logo";
import { Link } from "react-router-dom";

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between lg:px-8">
        <div>
          <Logo to="/" size="sm" />
          <p className="mt-3 max-w-xs text-sm text-slate-600 dark:text-slate-400">
            Connected care for patients, clinicians, and health operations.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400">
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/features/ai-assistant"
                  className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tools</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  to="/features/bmi-buddy"
                  className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  BMI Buddy
                </Link>
              </li>
              <li>
                <Link
                  to="/features/hospital-locator"
                  className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  Hospital locator
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400">
                  Urgent booking
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/login" className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400">
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  to="/portals"
                  className="text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        © {year} MediHub.
      </div>
    </footer>
  );
}
