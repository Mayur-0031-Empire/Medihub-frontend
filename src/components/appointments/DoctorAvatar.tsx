import { doctorDisplayName } from "@/lib/appointments";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { PublicDoctorProfile } from "@/types/appointment";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function DoctorAvatar({
  doctor,
  size = "md",
}: {
  doctor: PublicDoctorProfile;
  size?: "sm" | "md" | "lg";
}) {
  const name = doctorDisplayName(doctor);
  const photo = resolveMediaUrl(doctor.user?.photo);
  const dim =
    size === "sm" ? "h-12 w-12 text-sm" : size === "lg" ? "h-20 w-20 text-xl" : "h-16 w-16 text-base";

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className={`${dim} shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 font-semibold text-teal-800 shadow-sm`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
