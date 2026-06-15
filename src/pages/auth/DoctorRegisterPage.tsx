import { RegisterAccountSections } from "@/components/auth/RegisterAccountSections";
import { RegisterRoleRadio } from "@/components/auth/RegisterRoleRadio";
import { DoctorProfessionalProfileFields } from "@/components/doctor/DoctorProfessionalProfileFields";
import {createDoctorProfile, isServerConfigured, registerAccount, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE_AUTH } from "@/lib/userMessages";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { markJustRegistered } from "@/lib/dashboard/welcome";
import {
  doctorFormToCreatePayload,
  hasDoctorProfileErrors,
  validateDoctorProfileForm,
  type DoctorProfileErrors,
} from "@/lib/doctors";
import { btnPrimary } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { registerPathForRole } from "@/lib/auth";
import { registerHeadline, registerSectionTitles } from "@/lib/auth";
import {
  hasValidationErrors,
  REGISTER_FIELD_SCROLL_ORDER_NO_ROLE,
  validateRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormValues,
} from "@/lib/auth";
import type { PortalRole } from "@/types/auth";
import {
  newDoctorQualificationRow,
  type DoctorProfileFormState,
  type DoctorQualificationRow,
} from "@/types/doctor";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";

function fieldScrollTargetId(formId: string, field: keyof RegisterFormValues | "photo"): string {
  if (field === "photo") return `${formId}-photo-input`;
  return `${formId}-${String(field)}`;
}

function scrollToFirstRegisterError(formId: string, errs: RegisterFieldErrors) {
  for (const field of REGISTER_FIELD_SCROLL_ORDER_NO_ROLE) {
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

const DOCTOR_ERR_SCROLL: { key: keyof DoctorProfileErrors; suffix: string }[] = [
  { key: "specialization", suffix: "doc-spec" },
  { key: "experienceYears", suffix: "doc-years" },
  { key: "consultationFee", suffix: "doc-fee" },
  { key: "hospitalName", suffix: "doc-hospital" },
  { key: "availabilitySchedule", suffix: "doc-sched" },
  { key: "qualifications", suffix: "doc-qualifications" },
];

function scrollToFirstDoctorError(formId: string, errs: DoctorProfileErrors) {
  for (const { key, suffix } of DOCTOR_ERR_SCROLL) {
    if (!errs[key]) continue;
    const el = document.getElementById(`${formId}-${suffix}`);
    if (!el) continue;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      el.focus({ preventScroll: true });
    }
    break;
  }
}

/** Doctor registration: account signup and professional profile in one flow. */
export function DoctorRegisterPage() {
  const navigate = useNavigate();
  const formId = useId();
  const serverOk = isServerConfigured();
  const sectionTitles = registerSectionTitles("doctor");

  const [registerValues, setRegisterValues] = useState<RegisterFormValues>(() => ({
    firstName: "",
    lastName: "",
    username: "",
    role: "doctor",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    photo: null,
  }));
  const [registerErrors, setRegisterErrors] = useState<RegisterFieldErrors>({});

  const [doctorValues, setDoctorValues] = useState<DoctorProfileFormState>({
    specialization: "",
    experienceYears: "",
    hospitalName: "",
    consultationFee: "",
    availabilitySchedule: "",
    qualifications: [newDoctorQualificationRow(), newDoctorQualificationRow()],
  });
  const [doctorErrors, setDoctorErrors] = useState<DoctorProfileErrors>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  /** Account created and session active; professional profile save may still be pending. */
  const [accountCreated, setAccountCreated] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function onRoleChange(role: PortalRole) {
    if (role === "doctor") return;
    navigate(registerPathForRole(role), { replace: true });
  }

  function updateRegister<K extends keyof RegisterFormValues>(key: K, value: RegisterFormValues[K]) {
    setFormError(null);
    setRegisterValues((prev) => ({ ...prev, [key]: value }));
    setRegisterErrors((prev) => {
      if (!prev[key as keyof RegisterFieldErrors]) return prev;
      const next = { ...prev };
      delete next[key as keyof RegisterFieldErrors];
      return next;
    });
    if (key === "password" || key === "confirmPassword") {
      if (key === "password") {
        setRegisterErrors((prev) => {
          if (!prev.confirmPassword) return prev;
          const next = { ...prev };
          delete next.confirmPassword;
          return next;
        });
      }
    }
  }

  function onPhotoChange(file: File | null) {
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    updateRegister("photo", file);
  }

  function updateDoctor<K extends keyof DoctorProfileFormState>(key: K, v: DoctorProfileFormState[K]) {
    setFormError(null);
    setDoctorValues((prev) => ({ ...prev, [key]: v }));
    setDoctorErrors((prev) => {
      if (!prev[key as keyof DoctorProfileErrors]) return prev;
      const next = { ...prev };
      delete next[key as keyof DoctorProfileErrors];
      return next;
    });
  }

  function updateDoctorRow(index: number, patch: Partial<DoctorQualificationRow>) {
    setFormError(null);
    setDoctorValues((prev) => ({
      ...prev,
      qualifications: prev.qualifications.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
    setDoctorErrors((prev) => {
      if (!prev.qualifications) return prev;
      const next = { ...prev };
      delete next.qualifications;
      return next;
    });
  }

  function addQualificationRow() {
    updateDoctor("qualifications", [...doctorValues.qualifications, newDoctorQualificationRow()]);
  }

  function removeQualificationRow(index: number) {
    if (doctorValues.qualifications.length <= 1) return;
    updateDoctor(
      "qualifications",
      doctorValues.qualifications.filter((_, i) => i !== index),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!serverOk) {
      setFormError(SERVICE_UNAVAILABLE_AUTH);
      return;
    }

    if (!accountCreated) {
      const regErr = validateRegisterForm(registerValues);
      const docErr = validateDoctorProfileForm(doctorValues);
      if (hasValidationErrors(regErr)) {
        flushSync(() => {
          setRegisterErrors(regErr);
          setDoctorErrors({});
        });
        scrollToFirstRegisterError(formId, regErr);
        setFormError("Please fix the highlighted account fields to continue.");
        return;
      }
      if (hasDoctorProfileErrors(docErr)) {
        flushSync(() => {
          setRegisterErrors({});
          setDoctorErrors(docErr);
        });
        scrollToFirstDoctorError(formId, docErr);
        setFormError("Please fix the highlighted professional fields to continue.");
        return;
      }

      setRegisterErrors({});
      setDoctorErrors({});
      setLoading(true);
      try {
        const user = await registerAccount(registerValues);
        markJustRegistered(user._id);
        try {
          await createDoctorProfile(doctorFormToCreatePayload(doctorValues));
          navigate(dashboardHomePath("doctor"), { replace: true });
        } catch (profileErr) {
          setAccountCreated(true);
          setFormError(
            profileErr instanceof Error
              ? `${profileErr.message} Your doctor account is active — fix the professional section below and submit again, or complete your profile later from the dashboard.`
              : "Professional profile could not be saved. Your account is active — try again below or from the dashboard.",
          );
        }
      } catch (err) {
        setFormError(userFacingError(err, "Registration failed."));
      } finally {
        setLoading(false);
      }
      return;
    }

    const docErr = validateDoctorProfileForm(doctorValues);
    if (hasDoctorProfileErrors(docErr)) {
      flushSync(() => setDoctorErrors(docErr));
      scrollToFirstDoctorError(formId, docErr);
      setFormError("Please fix the highlighted professional fields to continue.");
      return;
    }

    setDoctorErrors({});
    setLoading(true);
    try {
      await createDoctorProfile(doctorFormToCreatePayload(doctorValues));
      navigate(dashboardHomePath("doctor"), { replace: true });
    } catch (err) {
      setFormError(userFacingError(err, "Could not save professional profile."));
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
            {registerHeadline("doctor")}
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

          {accountCreated ? (
            <div
              className="mb-6 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950"
              role="status"
            >
              <p className="font-medium">Your account is ready.</p>
              <p className="mt-1 text-teal-900/90">
                Update the professional section if needed, then submit again.
              </p>
            </div>
          ) : null}

          <form id={formId} onSubmit={onSubmit} className="space-y-8" noValidate>
            <RegisterRoleRadio
              formId={formId}
              value="doctor"
              onChange={onRoleChange}
              disabled={loading || accountCreated}
              roleError={registerErrors.role}
            />
            <RegisterAccountSections
              formId={formId}
              fixedRole="doctor"
              values={registerValues}
              errors={registerErrors}
              loading={loading}
              accountFieldsDisabled={accountCreated}
              sectionTitles={sectionTitles}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirm={showConfirm}
              setShowConfirm={setShowConfirm}
              update={updateRegister}
              onPhotoChange={onPhotoChange}
              photoPreview={photoPreview}
              setErrors={setRegisterErrors}
            />

            <DoctorProfessionalProfileFields
              formId={formId}
              values={doctorValues}
              errors={doctorErrors}
              disabled={loading}
              onUpdate={updateDoctor}
              onUpdateRow={updateDoctorRow}
              onAddRow={addQualificationRow}
              onRemoveRow={removeQualificationRow}
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
                  {accountCreated ? "Saving professional profile…" : "Creating doctor account…"}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" aria-hidden />
                  {accountCreated ? "Save professional profile" : "Create doctor account & profile"}
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login?portal=doctor" className="font-semibold text-teal-700 hover:text-teal-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
