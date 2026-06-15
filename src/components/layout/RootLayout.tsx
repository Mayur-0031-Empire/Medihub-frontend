import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { DocumentTitle } from "@/components/layout/DocumentTitle";
import { Outlet, useLocation } from "react-router-dom";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Welcome",
  "/splash": "Welcome",
  "/about": "About MediHub",
  "/contact": "Contact us",
  "/questions": "Questions",
  "/reviews": "Reviews",
  "/home": "MediHub",
  "/portals": "Register",
  "/login": "Sign in",
  "/register": "Register",
  "/register/patient": "Patient registration",
  "/register/doctor": "Doctor registration",
  "/features/ai-assistant": "AI Assistant",
  "/features/bmi-buddy": "BMI Buddy",
  "/features/hospital-locator": "Hospital Locator",
  "/emergency": "Urgent booking",
};

export function RootLayout() {
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] ?? (pathname.startsWith("/dashboard") ? "Dashboard" : undefined);
  const isSplash = pathname === "/splash";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <DocumentTitle title={title} />
      {isSplash ? null : <PublicNavbar />}
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      {isSplash ? null : <PublicFooter />}
    </div>
  );
}
