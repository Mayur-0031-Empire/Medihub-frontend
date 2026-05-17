import { registerPhotoHint } from "@/lib/auth";
import type { RegisterFieldErrors, RegisterFormValues } from "@/lib/auth";
import type { PortalRole } from "@/types/auth";
import { Camera, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

const inputBase =
  "w-full rounded-xl border bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:bg-white disabled:opacity-60";
const inputOk = "border-slate-200 ring-teal-600/30 focus:border-teal-500 focus:ring-4";
const inputErr = "border-red-400 ring-red-200/50 focus:border-red-500 focus:ring-4";

function fieldClass(error?: string): string {
  return `${inputBase} ${error ? inputErr : inputOk}`;
}

export function PasswordHints({ password }: { password: string }) {
  const rules = [
    { ok: password.length >= 8, text: "At least 8 characters" },
    { ok: /[a-z]/.test(password), text: "One lowercase letter" },
    { ok: /[A-Z]/.test(password), text: "One uppercase letter" },
    { ok: /\d/.test(password), text: "One number" },
  ];
  return (
    <ul className="mt-2 space-y-1 text-xs" aria-live="polite">
      {rules.map(({ ok, text }) => (
        <li key={text} className={ok ? "text-teal-700" : "text-slate-500"}>
          {ok ? "✓ " : "○ "}
          {text}
        </li>
      ))}
    </ul>
  );
}

export type RegisterAccountSectionsProps = {
  formId: string;
  fixedRole: PortalRole;
  values: RegisterFormValues;
  errors: RegisterFieldErrors;
  loading: boolean;
  /** Lock identity fields after account is created (e.g. retry doctor profile only). */
  accountFieldsDisabled?: boolean;
  sectionTitles: { personal: string; account: string; security: string; photo: string };
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  showConfirm: boolean;
  setShowConfirm: Dispatch<SetStateAction<boolean>>;
  update: <K extends keyof RegisterFormValues>(key: K, value: RegisterFormValues[K]) => void;
  onPhotoChange: (file: File | null) => void;
  photoPreview: string | null;
  setErrors: Dispatch<SetStateAction<RegisterFieldErrors>>;
};

export function RegisterAccountSections({
  formId,
  fixedRole,
  values,
  errors,
  loading,
  accountFieldsDisabled = false,
  sectionTitles,
  showPassword,
  setShowPassword,
  showConfirm,
  setShowConfirm,
  update,
  onPhotoChange,
  photoPreview,
  setErrors,
}: RegisterAccountSectionsProps) {
  const accountLocked = loading || accountFieldsDisabled;
  return (
    <>
      <section aria-labelledby={`${formId}-personal`}>
        <h2 id={`${formId}-personal`} className="mb-3 text-sm font-semibold text-slate-900">
          {sectionTitles.personal}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-firstName`} className="mb-1 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              id={`${formId}-firstName`}
              autoComplete="given-name"
              value={values.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              disabled={accountLocked}
              className={fieldClass(errors.firstName)}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? `${formId}-firstName-err` : undefined}
            />
            {errors.firstName ? (
              <p id={`${formId}-firstName-err`} className="mt-1 text-xs text-red-600" role="alert">
                {errors.firstName}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`${formId}-lastName`} className="mb-1 block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input
              id={`${formId}-lastName`}
              autoComplete="family-name"
              value={values.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              disabled={accountLocked}
              className={fieldClass(errors.lastName)}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? `${formId}-lastName-err` : undefined}
            />
            {errors.lastName ? (
              <p id={`${formId}-lastName-err`} className="mt-1 text-xs text-red-600" role="alert">
                {errors.lastName}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby={`${formId}-account`}>
        <h2 id={`${formId}-account`} className="mb-3 text-sm font-semibold text-slate-900">
          {sectionTitles.account}
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor={`${formId}-username`} className="mb-1 block text-sm font-medium text-slate-700">
              Username
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id={`${formId}-username`}
                autoComplete="username"
                value={values.username}
                onChange={(e) => update("username", e.target.value)}
                disabled={accountLocked}
                className={`${fieldClass(errors.username)} pl-10`}
                placeholder="asha_sharma"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? `${formId}-username-err` : `${formId}-username-hint`}
              />
            </div>
            <p id={`${formId}-username-hint`} className="mt-1 text-xs text-slate-500">
              3–32 characters: letter first, then letters, numbers, or underscores.
            </p>
            {errors.username ? (
              <p id={`${formId}-username-err`} className="mt-1 text-xs text-red-600" role="alert">
                {errors.username}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${formId}-email`} className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id={`${formId}-email`}
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => update("email", e.target.value)}
                disabled={accountLocked}
                className={`${fieldClass(errors.email)} pl-10`}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${formId}-email-err` : undefined}
              />
            </div>
            {errors.email ? (
              <p id={`${formId}-email-err`} className="mt-1 text-xs text-red-600" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${formId}-phone`} className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <div className="relative">
              <Phone
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id={`${formId}-phone`}
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(e) => update("phone", e.target.value)}
                disabled={accountLocked}
                className={`${fieldClass(errors.phone)} pl-10`}
                placeholder="+91 99999 99999"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? `${formId}-phone-err` : `${formId}-phone-hint`}
              />
            </div>
            <p id={`${formId}-phone-hint`} className="mt-1 text-xs text-slate-500">
              10–15 digits; country code with + is fine.
            </p>
            {errors.phone ? (
              <p id={`${formId}-phone-err`} className="mt-1 text-xs text-red-600" role="alert">
                {errors.phone}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby={`${formId}-security`}>
        <h2 id={`${formId}-security`} className="mb-3 text-sm font-semibold text-slate-900">
          {sectionTitles.security}
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor={`${formId}-password`} className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id={`${formId}-password`}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={values.password}
                onChange={(e) => update("password", e.target.value)}
                disabled={accountLocked}
                className={`${fieldClass(errors.password)} pl-10 pr-11`}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={`${formId}-password-hints`}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                onClick={() => setShowPassword((v) => !v)}
                disabled={accountLocked}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div id={`${formId}-password-hints`}>
              <PasswordHints password={values.password} />
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${formId}-confirmPassword`} className="mb-1 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id={`${formId}-confirmPassword`}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                onBlur={() => {
                  if (values.confirmPassword && values.confirmPassword !== values.password) {
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: "Passwords do not match.",
                    }));
                  }
                }}
                disabled={accountLocked}
                className={`${fieldClass(errors.confirmPassword)} pl-10 pr-11`}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                onClick={() => setShowConfirm((v) => !v)}
                disabled={accountLocked}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby={`${formId}-photo`}>
        <h2 id={`${formId}-photo`} className="mb-3 text-sm font-semibold text-slate-900">
          {sectionTitles.photo}
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-10 w-10 text-slate-400" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor={`${formId}-photo-input`} className="mb-1 block text-sm font-medium text-slate-700">
              Upload photo
            </label>
            <input
              id={`${formId}-photo-input`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={accountLocked}
              onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:font-medium file:text-white file:hover:bg-teal-700"
              aria-invalid={Boolean(errors.photo)}
              aria-describedby={errors.photo ? `${formId}-photo-err` : `${formId}-photo-hint`}
            />
            <p id={`${formId}-photo-hint`} className="mt-1 text-xs text-slate-500">
              {registerPhotoHint(fixedRole)}
            </p>
            {errors.photo ? (
              <p id={`${formId}-photo-err`} className="mt-1 text-xs text-red-600" role="alert">
                {errors.photo}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
