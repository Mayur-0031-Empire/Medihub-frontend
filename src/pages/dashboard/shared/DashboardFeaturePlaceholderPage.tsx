import { dashboardHomePath } from "@/lib/dashboardPaths";
import { ArrowLeft } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

interface DashboardFeaturePlaceholderPageProps {
  title: string;
  description: string;
}

export function DashboardFeaturePlaceholderPage({ title, description }: DashboardFeaturePlaceholderPageProps) {
  const { user } = useOutletContext<DashboardOutletContext>();
  const home = dashboardHomePath(user.role);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to={home}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to overview
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>
        <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
          The full experience for this area is coming soon.
        </p>
      </div>
    </div>
  );
}
