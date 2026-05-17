import type { PortalRole } from "@/types/auth";
import {
  highlightActive,
  highlightInactive,
  textBody,
  textOnHighlightActive,
  textOnHighlightInactive,
  textSubtle,
} from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { Heart, Shield, Stethoscope } from "lucide-react";

const roles: { id: PortalRole; label: string; description: string; icon: typeof Heart }[] = [
  {
    id: "patient",
    label: "Patient",
    description: "Book visits, reports & care",
    icon: Heart,
  },
  {
    id: "doctor",
    label: "Doctor",
    description: "Schedule, consult & prescribe",
    icon: Stethoscope,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Verify providers & oversight",
    icon: Shield,
  },
];

interface PortalRolePickerProps {
  value: PortalRole;
  onChange: (role: PortalRole) => void;
  disabled?: boolean;
  /** Heading above role cards (default: Sign in as). */
  label?: string;
  /** Helper text under the role grid. */
  footerHint?: string;
  /** When set, shows border + message for accessibility (e.g. submit without choosing). */
  roleError?: string;
}

export function PortalRolePicker({
  value,
  onChange,
  disabled,
  label = "Sign in as",
  footerHint = "Your account role must match the portal you select. We verify after sign-in.",
  roleError,
}: PortalRolePickerProps) {
  return (
    <div>
      <p className={cn("mb-2 text-sm font-medium", textBody)}>{label}</p>
      <div
        className={cn(
          "grid grid-cols-1 gap-2 rounded-xl sm:grid-cols-3",
          roleError && "ring-2 ring-red-300 ring-offset-2 dark:ring-red-800 dark:ring-offset-slate-900",
        )}
      >
        {roles.map(({ id, label: roleLabel, description, icon: Icon }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                "flex flex-col items-start rounded-xl border px-3 py-3 text-left transition",
                active ? highlightActive : highlightInactive,
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              )}
            >
              <span className="mb-1 flex w-full items-center gap-2">
                <Icon
                  className={cn("shrink-0", active ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400")}
                  size={18}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={cn("text-sm font-semibold", active ? textOnHighlightActive : textOnHighlightInactive)}>
                  {roleLabel}
                </span>
              </span>
              <span className={cn("text-xs", textSubtle)}>{description}</span>
            </button>
          );
        })}
      </div>
      <p className={cn("mt-2 text-xs", textSubtle)}>{footerHint}</p>
      {roleError ? (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {roleError}
        </p>
      ) : null}
    </div>
  );
}
