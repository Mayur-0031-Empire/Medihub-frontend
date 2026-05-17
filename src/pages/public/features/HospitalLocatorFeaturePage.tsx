import { HomeHospitalTools } from "@/components/public/HomeHospitalTools";
import { Link } from "react-router-dom";

export function HospitalLocatorFeaturePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400">
          ← Back to home
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Hospital Locator & Network</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Explore facilities near you and see how doctors connect across hospitals.
      </p>
      <div className="mt-8">
        <HomeHospitalTools />
      </div>
    </div>
  );
}
