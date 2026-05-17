import {
  highlightActive,
  highlightInactive,
  textHeading,
  textOnHighlightActive,
  textOnHighlightInactive,
  textSubtle,
} from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import type { PortalRole } from "@/types/auth";
import { Heart, Shield, Stethoscope } from "lucide-react";

const roles: { id: PortalRole; label: string; description: string; icon: typeof Heart }[] = [
  { id: "patient", label: "Patient", description: "Book visits, reports & care", icon: Heart },
  { id: "doctor", label: "Doctor", description: "Schedule, consult & prescribe", icon: Stethoscope },
  { id: "admin", label: "Admin", description: "Verify providers & oversight", icon: Shield },
];

type RegisterRoleRadioProps = {
  formId: string;
  value: PortalRole;
  onChange: (role: PortalRole) => void;
  disabled?: boolean;
  roleError?: string;
};

/** Role selection for registration — radio group at the top of the form. */
export function RegisterRoleRadio({ formId, value, onChange, disabled, roleError }: RegisterRoleRadioProps) {
  return (
    <fieldset
      id={`${formId}-role-anchor`}
      className={roleError ? "rounded-xl ring-2 ring-red-300 ring-offset-2" : undefined}
      aria-invalid={Boolean(roleError)}
    >
      <legend className={cn("mb-3 text-sm font-semibold", textHeading)}>Account type</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" role="radiogroup" aria-label="Account type">
        {roles.map(({ id, label, description, icon: Icon }) => {
          const active = value === id;
          return (
            <label
              key={id}
              className={[
                "flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition sm:min-w-[9.5rem]",
                active ? highlightActive : highlightInactive,
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name={`${formId}-role`}
                value={id}
                checked={active}
                disabled={disabled}
                onChange={() => onChange(id)}
                className="mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <Icon
                    className={active ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"}
                    size={18}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className={cn("text-sm font-semibold", active ? textOnHighlightActive : textOnHighlightInactive)}>
                    {label}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
              </span>
            </label>
          );
        })}
      </div>
      {roleError ? (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {roleError}
        </p>
      ) : (
        <p className={cn("mt-2 text-xs", textSubtle)}>
          Pick the role that matches how you will use MediHub. Doctors also complete practice details below.
        </p>
      )}
    </fieldset>
  );
}
