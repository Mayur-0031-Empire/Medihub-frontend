import { HospitalLocatorExperience } from "@/components/hospital-locator/HospitalLocatorExperience";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { ArrowLeft } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

export function HospitalLocatorPage() {
  const { user } = useOutletContext<DashboardOutletContext>();
  const home = dashboardHomePath(user.role);

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to={home}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to overview
      </Link>

      <HospitalLocatorExperience
        heading="Hospital locator"
        className=""
      />
    </div>
  );
}
