import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { NearbyHospital } from "@/types/hospital";
import { Building2, Clock, ExternalLink, MapPin, Phone } from "lucide-react";

type HospitalLocatorCardProps = {
  hospital: NearbyHospital;
  selected?: boolean;
  onSelect?: () => void;
};

export function HospitalLocatorCard({ hospital, selected, onSelect }: HospitalLocatorCardProps) {
  const imageUrl = resolveMediaUrl(hospital.profilePicture);
  const phoneDigits = hospital.phone?.replace(/[^\d+]/g, "");
  const phoneHref = phoneDigits ? `tel:${phoneDigits}` : undefined;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`flex cursor-pointer gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-teal-200 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/25 ${
        selected ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200"
      }`}
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Building2 className="h-10 w-10" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900">{hospital.name}</h3>
          {hospital.distanceKm != null ? (
            <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              {hospital.distanceKm < 1
                ? `${Math.round(hospital.distanceKm * 1000)} m`
                : `${hospital.distanceKm.toFixed(1)} km`}
            </span>
          ) : null}
        </div>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
          <span>{hospital.address}</span>
        </p>
        {hospital.phone ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-700">
            <Phone className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
            {phoneHref ? (
              <a
                href={phoneHref}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                {hospital.phone}
              </a>
            ) : (
              <span>{hospital.phone}</span>
            )}
          </p>
        ) : null}
        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
          <span>
            {hospital.openNow != null ? (
              <span className={hospital.openNow ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
                {hospital.openNow ? "Open now" : "Closed now"}
                {hospital.workingHours ? " · " : ""}
              </span>
            ) : null}
            {hospital.workingHours ?? "Hours not listed — contact the hospital"}
          </span>
        </p>
        {hospital.googleMapsUri ? (
          <a
            href={hospital.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            Directions
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}
