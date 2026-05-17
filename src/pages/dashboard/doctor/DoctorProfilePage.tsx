import { DoctorCancelledAppointmentsSection } from "@/components/doctor/DoctorCancelledAppointmentsSection";
import { DoctorProfessionalProfileFields } from "@/components/doctor/DoctorProfessionalProfileFields";
import {
  addDoctorDocuments,
  createDoctorProfile,
  fetchDoctorMe,
  updateDoctorProfile,
  userFacingError,
} from "@/lib/api";
import { dashboardHomePath } from "@/lib/dashboardPaths";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  doctorFormToCreatePayload,
  doctorMeToFormState,
  hasDoctorProfileErrors,
  validateDoctorProfileForm,
  validateDoctorProfileUpdateForm,
  type DoctorProfileErrors,
  type ExistingDoctorDocument,
} from "@/lib/doctors";
import {
  newDoctorQualificationRow,
  type DoctorProfileFormState,
  type DoctorQualificationRow,
} from "@/types/doctor";
import { FileText, Loader2, Save } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

export function DoctorProfilePage() {
  const navigate = useNavigate();
  const formId = useId();
  const { user } = useOutletContext<DashboardOutletContext>();

  /** `undefined` = loading; `null` = no doctor profile yet; otherwise saved profile payload. */
  const [doctorMe, setDoctorMe] = useState<unknown | null | undefined>(undefined);
  const [existingDocuments, setExistingDocuments] = useState<ExistingDoctorDocument[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [values, setValues] = useState<DoctorProfileFormState>({
    specialization: "",
    experienceYears: "",
    hospitalName: "",
    consultationFee: "",
    availabilitySchedule: "",
    qualifications: [newDoctorQualificationRow(), newDoctorQualificationRow()],
  });
  const [errors, setErrors] = useState<DoctorProfileErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDoctorMe();
        if (cancelled) return;
        setDoctorMe(data);
        if (data !== null) {
          const parsed = doctorMeToFormState(data);
          setValues(parsed.values);
          setExistingDocuments(parsed.existingDocuments);
          setIsEditMode(true);
        }
      } catch (e) {
        if (!cancelled) {
          setDoctorMe(null);
          notifyError(userFacingError(e, "Could not load doctor profile."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (user.role !== "doctor") {
    return <Navigate to={dashboardHomePath(user.role)} replace />;
  }

  function update<K extends keyof DoctorProfileFormState>(key: K, v: DoctorProfileFormState[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => {
      if (!prev[key as keyof DoctorProfileErrors]) return prev;
      const next = { ...prev };
      delete next[key as keyof DoctorProfileErrors];
      return next;
    });
  }

  function updateRow(index: number, patch: Partial<DoctorQualificationRow>) {
    setValues((prev) => ({
      ...prev,
      qualifications: prev.qualifications.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
    setErrors((prev) => {
      if (!prev.qualifications) return prev;
      const next = { ...prev };
      delete next.qualifications;
      return next;
    });
  }

  function addRow() {
    update("qualifications", [...values.qualifications, newDoctorQualificationRow()]);
  }

  function removeRow(index: number) {
    if (values.qualifications.length <= 1) return;
    update(
      "qualifications",
      values.qualifications.filter((_, i) => i !== index),
    );
  }

  async function saveProfile() {
    const next = isEditMode ? validateDoctorProfileUpdateForm(values) : validateDoctorProfileForm(values);
    if (hasDoctorProfileErrors(next)) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (isEditMode) {
        const payload = doctorFormToCreatePayload(values);
        await updateDoctorProfile({
          specialization: payload.specialization,
          experienceYears: payload.experienceYears,
          hospitalName: payload.hospitalName,
          consultationFee: payload.consultationFee,
          availabilitySchedule: payload.availabilitySchedule,
        });
        if (payload.documents.length > 0) {
          await addDoctorDocuments(payload.documents);
        }
        const data = await fetchDoctorMe();
        setDoctorMe(data);
        if (data !== null) {
          const parsed = doctorMeToFormState(data);
          setValues(parsed.values);
          setExistingDocuments(parsed.existingDocuments);
        }
        notifySuccess("Profile updated.");
      } else {
        await createDoctorProfile(doctorFormToCreatePayload(values));
        notifySuccess("Professional profile submitted.");
        navigate("/dashboard/doctor", { replace: false });
      }
    } catch (err) {
      notifyError(userFacingError(err, "Could not save profile."));
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void saveProfile();
  }

  if (doctorMe === undefined) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard/doctor" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to workspace
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {isEditMode ? "Edit professional profile" : "Doctor professional profile"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {isEditMode
          ? "Update your practice details. Add new qualification documents below when needed."
          : "Submit your specialty, experience, practice details, schedule, and qualification documents."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
        <DoctorProfessionalProfileFields
          formId={formId}
          values={values}
          errors={errors}
          disabled={saving}
          onUpdate={update}
          onUpdateRow={updateRow}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          documentsRequired={!isEditMode}
          existingDocuments={existingDocuments}
        />
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              {isEditMode ? <Save className="h-4 w-4" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
              {isEditMode ? "Save changes" : "Submit professional profile"}
            </>
          )}
        </button>
      </form>

      {isEditMode ? <DoctorCancelledAppointmentsSection limit={5} className="mt-10" /> : null}
    </div>
  );
}
