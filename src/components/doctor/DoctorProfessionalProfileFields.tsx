import type { DoctorProfileErrors, ExistingDoctorDocument } from "@/lib/doctors";
import type { DoctorProfileFormState, DoctorQualificationRow } from "@/types/doctor";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25 disabled:opacity-60";

function fieldClass(err?: string): string {
  return `${inputBase} ${err ? "border-red-400 ring-2 ring-red-100" : ""}`;
}

export type DoctorProfessionalProfileFieldsProps = {
  formId: string;
  values: DoctorProfileFormState;
  errors: DoctorProfileErrors;
  disabled: boolean;
  onUpdate: <K extends keyof DoctorProfileFormState>(key: K, v: DoctorProfileFormState[K]) => void;
  onUpdateRow: (index: number, patch: Partial<DoctorQualificationRow>) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  /** When false, qualification uploads are optional (profile edit). Default true. */
  documentsRequired?: boolean;
  existingDocuments?: ExistingDoctorDocument[];
};

/** Professional profile fields collected for doctor onboarding. */
export function DoctorProfessionalProfileFields({
  formId,
  values,
  errors,
  disabled,
  onUpdate,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
  documentsRequired = true,
  existingDocuments = [],
}: DoctorProfessionalProfileFieldsProps) {
  return (
    <section aria-labelledby={`${formId}-professional`} className="space-y-6">
      <h2 id={`${formId}-professional`} className="text-sm font-semibold text-slate-900">
        Professional profile
      </h2>
      <p className="-mt-2 text-xs text-slate-500">
        Please provide your <strong className="text-slate-700">specialization</strong>,{" "}
        <strong className="text-slate-700">experience</strong>, <strong className="text-slate-700">hospital</strong>,{" "}
        <strong className="text-slate-700">fee</strong>, <strong className="text-slate-700">availability</strong>, and{" "}
        <strong className="text-slate-700">qualification documents</strong>
        {documentsRequired ? "." : " (optional when updating — add more below)."}
      </p>

      <div id={`${formId}-doc-spec`}>
        <label htmlFor={`${formId}-spec`} className="mb-1 block text-sm font-medium text-slate-700">
          Specialization
        </label>
        <input
          id={`${formId}-spec`}
          value={values.specialization}
          onChange={(e) => onUpdate("specialization", e.target.value)}
          disabled={disabled}
          className={fieldClass(errors.specialization)}
          placeholder="e.g. Cardiology"
          aria-invalid={Boolean(errors.specialization)}
        />
        {errors.specialization ? (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.specialization}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div id={`${formId}-doc-years`}>
          <label htmlFor={`${formId}-years`} className="mb-1 block text-sm font-medium text-slate-700">
            Years of experience
          </label>
          <input
            id={`${formId}-years`}
            inputMode="numeric"
            value={values.experienceYears}
            onChange={(e) => onUpdate("experienceYears", e.target.value)}
            disabled={disabled}
            className={fieldClass(errors.experienceYears)}
            placeholder="8"
            aria-invalid={Boolean(errors.experienceYears)}
          />
          {errors.experienceYears ? (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.experienceYears}
            </p>
          ) : null}
        </div>
        <div id={`${formId}-doc-fee`}>
          <label htmlFor={`${formId}-fee`} className="mb-1 block text-sm font-medium text-slate-700">
            Consultation fee
          </label>
          <input
            id={`${formId}-fee`}
            inputMode="decimal"
            value={values.consultationFee}
            onChange={(e) => onUpdate("consultationFee", e.target.value)}
            disabled={disabled}
            className={fieldClass(errors.consultationFee)}
            placeholder="700"
            aria-invalid={Boolean(errors.consultationFee)}
          />
          {errors.consultationFee ? (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.consultationFee}
            </p>
          ) : null}
        </div>
      </div>

      <div id={`${formId}-doc-hospital`}>
        <label htmlFor={`${formId}-hospital`} className="mb-1 block text-sm font-medium text-slate-700">
          Hospital or clinic name
        </label>
        <input
          id={`${formId}-hospital`}
          value={values.hospitalName}
          onChange={(e) => onUpdate("hospitalName", e.target.value)}
          disabled={disabled}
          className={fieldClass(errors.hospitalName)}
          placeholder="City Care Hospital"
          aria-invalid={Boolean(errors.hospitalName)}
        />
        {errors.hospitalName ? (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.hospitalName}
          </p>
        ) : null}
      </div>

      <div id={`${formId}-doc-sched`}>
        <label htmlFor={`${formId}-sched`} className="mb-1 block text-sm font-medium text-slate-700">
          Availability schedule
        </label>
        <textarea
          id={`${formId}-sched`}
          rows={3}
          value={values.availabilitySchedule}
          onChange={(e) => onUpdate("availabilitySchedule", e.target.value)}
          disabled={disabled}
          className={fieldClass(errors.availabilitySchedule)}
          placeholder="e.g. Mon–Fri 09:00–17:00, or list the days and times patients can book"
          aria-invalid={Boolean(errors.availabilitySchedule)}
        />
        {errors.availabilitySchedule ? (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.availabilitySchedule}
          </p>
        ) : null}
      </div>

      <section aria-labelledby={`${formId}-docs`} id={`${formId}-doc-qualifications`}>
        {existingDocuments.length > 0 ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Documents on file</h3>
            <ul className="mt-2 space-y-2">
              {existingDocuments.map((doc, i) => (
                <li key={`${doc.title}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-800">{doc.title}</span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800"
                    >
                      View
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Uploaded</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 id={`${formId}-docs`} className="text-sm font-semibold text-slate-900">
            {documentsRequired ? "Qualification documents" : "Add more documents"}
          </h3>
          <button
            type="button"
            onClick={onAddRow}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add row
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          {documentsRequired
            ? "Add one row per document. Use the same order as your files so each title matches the correct upload."
            : "Optional: add new qualification files. Each row needs a title and file."}
        </p>
        <ul className="space-y-4">
          {values.qualifications.map((row, index) => (
            <li key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Document {index + 1}</span>
                <button
                  type="button"
                  onClick={() => onRemoveRow(index)}
                  disabled={disabled || values.qualifications.length <= 1}
                  className="rounded-lg p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label={`Remove document ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-2 mb-1 block text-xs font-medium text-slate-600">Title</label>
              <input
                value={row.title}
                onChange={(e) => onUpdateRow(index, { title: e.target.value })}
                disabled={disabled}
                className={fieldClass()}
                placeholder="e.g. MBBS degree"
              />
              <label className="mt-3 mb-1 block text-xs font-medium text-slate-600">File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
                disabled={disabled}
                onChange={(e) => onUpdateRow(index, { file: e.target.files?.[0] ?? null })}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
              />
            </li>
          ))}
        </ul>
        {errors.qualifications ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {errors.qualifications}
          </p>
        ) : null}
      </section>
    </section>
  );
}
