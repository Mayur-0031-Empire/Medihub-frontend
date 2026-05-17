import { AppointmentFileList } from "@/components/appointments/AppointmentFileList";
import type { AppointmentFileRef } from "@/types/appointment";
import { FileDown } from "lucide-react";

type Props = {
  files: AppointmentFileRef[];
  compact?: boolean;
};

/** Patient-facing list of documents the doctor shared for a visit. */
export function PatientDoctorFilesSection({ files, compact }: Props) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <FileDown className="h-5 w-5 text-slate-600" aria-hidden />
        Files from your doctor
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Referrals, summaries, or other documents your doctor uploaded for this visit.
      </p>
      <div className="mt-3">
        <AppointmentFileList
          files={files}
          emptyMessage="No files from your doctor yet. They may add documents during or after your video visit."
        />
      </div>
    </section>
  );
}
