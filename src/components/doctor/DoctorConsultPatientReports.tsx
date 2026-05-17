import { userFacingError } from "@/lib/userMessages";
import { MedicalScanViewer } from "@/components/doctor/MedicalScanViewer";
import { extractTextFromDocument } from "@/lib/appointments/documentText";
import { fetchReportAsFile } from "@/lib/appointments/fetchReportAsFile";
import { imagingLabelFromName, isImagingFile, medicalFileKind } from "@/lib/appointments/medicalFileKind";
import { countFilledVitals, parseVitalsFromDocumentText } from "@/lib/appointments/vitals";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { ImagingClinicalContext } from "@/lib/consult/imagingAi";
import type { AppointmentFileRef } from "@/types/appointment";
import type { PatientVitals } from "@/types/vitals";
import { Activity, Eye, FileText, Loader2, ScanLine } from "lucide-react";
import { useState } from "react";

type Props = {
  files: AppointmentFileRef[];
  vitals: PatientVitals;
  onVitalsChange: (vitals: PatientVitals) => void;
  disabled?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  clinicalContext?: ImagingClinicalContext;
  /** MRI/X-ray list and AI scan — only during live video consult. */
  liveConsult?: boolean;
};

export function DoctorConsultPatientReports({
  files,
  vitals,
  onVitalsChange,
  disabled,
  onRefresh,
  refreshing,
  clinicalContext,
  liveConsult = false,
}: Props) {
  const [viewing, setViewing] = useState<AppointmentFileRef | null>(null);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function extractVitalsFromReport(fileRef: AppointmentFileRef, index: number) {
    const name = fileRef.name ?? fileRef.title ?? "";
    const kind = medicalFileKind(name);
    if (kind !== "pdf" && kind !== "text") {
      setMessage("Vitals extraction works on lab PDFs and text reports. Use View scan for X-ray/MRI images.");
      return;
    }
    setBusyIndex(index);
    setMessage(null);
    try {
      const file = await fetchReportAsFile(fileRef);
      const text = await extractTextFromDocument(file);
      const extracted = parseVitalsFromDocumentText(text);
      const merged = { ...vitals, ...extracted };
      onVitalsChange(merged);
      const count = countFilledVitals(extracted);
      setMessage(
        count > 0
          ? `Extracted ${count} vital${count === 1 ? "" : "s"} from ${name}. Review vitals below.`
          : "Report read but no vitals detected. Check labels like BP, weight, LDL/HDL.",
      );
    } catch (e) {
      setMessage(userFacingError(e, "Could not extract vitals."));
    } finally {
      setBusyIndex(null);
    }
  }

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-900">
          <FileText className="h-3.5 w-3.5" />
          Patient uploads
        </h3>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-[10px] font-semibold text-sky-800 hover:underline disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-slate-600">
        {liveConsult
          ? "MRI, X-ray, and lab files from the patient during this live call. View scans with AI analysis, or extract vitals from lab PDFs."
          : "Available when the video call is live. Ask the patient to join, then review uploads and run AI scan analysis here."}
      </p>

      {!liveConsult ? (
        <p className="mt-3 rounded-lg border border-dashed border-sky-200 bg-white/80 px-3 py-3 text-xs text-slate-600">
          Connect with the patient on video to unlock patient scan uploads and AI imaging review.
        </p>
      ) : files.length === 0 ? (
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-500">
          No files yet. The patient can upload from their video visit sidebar.
        </p>
      ) : liveConsult ? (
        <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {files.map((f, i) => {
            const name = f.title ?? f.name ?? `File ${i + 1}`;
            const href = resolveMediaUrl(f.url);
            const imaging = isImagingFile(name);
            const kind = medicalFileKind(name);
            const thumb = kind === "image" && href ? href : null;
            const busy = busyIndex === i;

            return (
              <li
                key={`${name}-${i}`}
                className="flex gap-2 rounded-lg border border-sky-100 bg-white p-2 shadow-sm"
              >
                {thumb ? (
                  <img src={thumb} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover bg-slate-100" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{name}</p>
                  {imaging ? (
                    <p className="text-[10px] text-sky-700">{imagingLabelFromName(name)}</p>
                  ) : (
                    <p className="text-[10px] text-slate-500">{kind === "pdf" ? "Lab / PDF" : "Document"}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {imaging && href ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setViewing(f)}
                        className="inline-flex items-center gap-1 rounded-md bg-sky-700 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
                      >
                        <ScanLine className="h-3 w-3" />
                        View + AI
                      </button>
                    ) : null}
                    {(kind === "pdf" || kind === "text") && (
                      <button
                        type="button"
                        disabled={disabled || busy}
                        onClick={() => void extractVitalsFromReport(f, i)}
                        className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Activity className="h-3 w-3" />
                        )}
                        Extract vitals
                      </button>
                    )}
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3 w-3" />
                        Open
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {message && liveConsult ? (
        <p
          className={[
            "mt-2 rounded-lg px-2 py-1.5 text-[11px]",
            message.includes("Extracted") ? "bg-teal-100 text-teal-950" : "bg-amber-50 text-amber-950",
          ].join(" ")}
        >
          {message}
        </p>
      ) : null}

      {viewing && liveConsult ? (
        <MedicalScanViewer
          file={viewing}
          clinicalContext={clinicalContext}
          aiEnabled
          onClose={() => setViewing(null)}
        />
      ) : null}
    </section>
  );
}
