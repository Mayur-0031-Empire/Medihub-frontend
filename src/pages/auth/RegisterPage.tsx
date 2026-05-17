import { RegisterAccountSections } from "@/components/auth/RegisterAccountSections";
import { RegisterRoleRadio } from "@/components/auth/RegisterRoleRadio";
import {isServerConfigured, registerAccount, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE_AUTH } from "@/lib/userMessages";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { DoctorRegisterPage } from "@/pages/auth/DoctorRegisterPage";
import { btnPrimary } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { normalizePortalRole, registerPathForRole } from "@/lib/auth";
import { registerHeadline, registerSectionTitles, registerSubmitLabel } from "@/lib/auth";
import {
  hasValidationErrors,
  REGISTER_FIELD_SCROLL_ORDER,
  validateRegisterForm,
  type RegisterField,
  type RegisterFieldErrors,
  type RegisterFormValues,
} from "@/lib/auth";
import type { PortalRole } from "@/types/auth";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

export function RegisterPage() {
  const { role: param } = useParams<{ role: string }>();
  const fixedRole = normalizePortalRole(param ?? "");
  if (!fixedRole) {
    return <Navigate to="/register/patient" replace />;
  }
  if (fixedRole === "doctor") {
    return <DoctorRegisterPage />;
  }
  return <RegisterForm key={fixedRole} fixedRole={fixedRole} />;
}

function fieldScrollTargetId(formId: string, field: RegisterField): string {
  if (field === "role") return `${formId}-role-anchor`;
  if (field === "photo") return `${formId}-photo-input`;
  return `${formId}-${field}`;
}

function scrollToFirstRegisterError(formId: string, errs: RegisterFieldErrors) {
  for (const field of REGISTER_FIELD_SCROLL_ORDER) {
    if (!errs[field]) continue;
    const id = fieldScrollTargetId(formId, field);
    const el = document.getElementById(id);
    if (!el) continue;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      el.focus({ preventScroll: true });
    }
    break;
  }
}

function RegisterForm({ fixedRole }: { fixedRole: PortalRole }) {
  const navigate = useNavigate();
  const formId = useId();
  const serverOk = isServerConfigured();
  const sectionTitles = registerSectionTitles(fixedRole);

  const [values, setValues] = useState<RegisterFormValues>(() => ({
    firstName: "",
    lastName: "",
    username: "",
    role: fixedRole,
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    photo: null,
  }));
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    setValues((prev) => (prev.role === fixedRole ? prev : { ...prev, role: fixedRole }));
  }, [fixedRole]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function clearFieldError(field: RegisterField) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function update<K extends keyof RegisterFormValues>(key: K, value: RegisterFormValues[K]) {
    setFormError(null);
    setValues((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key as RegisterField);
    if (key === "password" || key === "confirmPassword") {
      if (key === "password") clearFieldError("confirmPassword");
    }
  }

  function onRoleChange(role: PortalRole) {
    if (role === fixedRole) return;
    navigate(registerPathForRole(role), { replace: true });
  }

  function onPhotoChange(file: File | null) {
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    update("photo", file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!serverOk) {
      setFormError(SERVICE_UNAVAILABLE_AUTH);
      return;
    }

    const payload: RegisterFormValues = { ...values, role: fixedRole };
    const nextErrors = validateRegisterForm(payload);
    if (hasValidationErrors(nextErrors)) {
      flushSync(() => {
        setErrors(nextErrors);
      });
      scrollToFirstRegisterError(formId, nextErrors);
      setFormError("Please fix the highlighted fields to continue.");
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await registerAccount(payload, fixedRole);
      navigate(dashboardHomePath(fixedRole), { replace: true });
    } catch (err) {
      setFormError(userFacingError(err, "Registration failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-teal-50 via-white to-slate-100 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-slate-400/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="mb-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Create account</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {registerHeadline(fixedRole)}
          </h1>
        </div>

        <div className="relative z-10 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
          {!serverOk && (
            <div
              className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              role="status"
            >
              {SERVICE_UNAVAILABLE_AUTH}
            </div>
          )}

          <form id={formId} onSubmit={onSubmit} className="space-y-6" noValidate>
            <RegisterRoleRadio
              formId={formId}
              value={fixedRole}
              onChange={onRoleChange}
              disabled={loading}
              roleError={errors.role}
            />
            <RegisterAccountSections
              formId={formId}
              fixedRole={fixedRole}
              values={values}
              errors={errors}
              loading={loading}
              sectionTitles={sectionTitles}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirm={showConfirm}
              setShowConfirm={setShowConfirm}
              update={update}
              onPhotoChange={onPhotoChange}
              photoPreview={photoPreview}
              setErrors={setErrors}
            />

            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={cn(btnPrimary, "w-full py-3")}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Creating {fixedRole} account…
                </>
              ) : (
                registerSubmitLabel(fixedRole)
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to={`/login?portal=${fixedRole}`} className="font-semibold text-teal-700 hover:text-teal-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
