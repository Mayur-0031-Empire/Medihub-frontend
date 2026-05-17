import { AppointmentFileList } from "@/components/appointments/AppointmentFileList";
import { uploadPatientAppointmentReports, userFacingError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { AppointmentDetail } from "@/types/appointment";
import { FileUp, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

const ACCEPT_MEDICAL =
  ".pdf,.png,.jpg,.jpeg,.webp,.dcm,.txt,image/*,application/pdf,application/dicom";

type Props = {
  appointmentId: string;
  appt: AppointmentDetail;
  onUpdated: (detail: AppointmentDetail) => void;
  compact?: boolean;
};

export function ConsultMedicalUpload({ appointmentId, appt, onUpdated, compact }: Props) {
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("patientReports") as HTMLInputElement;
    const files = input.files ? [...input.files] : [];
    if (files.length === 0) {
      notifyError("Choose MRI, X-ray, lab PDF, or other images to upload.");
      return;
    }
    setUploading(true);
    try {
      const updated = await uploadPatientAppointmentReports(appointmentId, files);
      onUpdated(updated);
      notifySuccess(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}. Your doctor can view them now.`);
      form.reset();
    } catch (err) {
      notifyError(userFacingError(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      className={[
        "rounded-2xl border border-teal-200 bg-white shadow-sm",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <FileUp className="h-4 w-4 text-teal-600" aria-hidden />
        Medical images & reports
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        MRI, CT, X-ray, lab results — stored on this visit (ID{" "}
        <span className="font-mono text-slate-500">{appointmentId.slice(-8)}</span>).
      </p>

      <div className="mt-3 max-h-40 overflow-y-auto">
        <AppointmentFileList
          files={appt.patientReports ?? []}
          emptyMessage="No files yet for this visit."
        />
      </div>

      <form onSubmit={(e) => void onUpload(e)} className="mt-4 space-y-3">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-3 py-4 text-center">
          <input
            type="file"
            name="patientReports"
            multiple
            accept={ACCEPT_MEDICAL}
            className="sr-only"
            disabled={uploading}
          />
          <span className="text-xs font-semibold text-teal-900">Add MRI / scans / PDFs</span>
        </label>
        <button
          type="submit"
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Upload to this visit
        </button>
      </form>

    </section>
  );
}
