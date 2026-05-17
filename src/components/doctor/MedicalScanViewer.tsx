import { userFacingError } from "@/lib/userMessages";
import { analyzeMedicalScanWithAi, type ImagingClinicalContext } from "@/lib/consult/imagingAi";
import { fetchReportAsFile } from "@/lib/appointments/fetchReportAsFile";
import { imagingLabelFromName, medicalFileKind } from "@/lib/appointments/medicalFileKind";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { AppointmentFileRef } from "@/types/appointment";
import { Loader2, ScanLine, Sparkles, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  file: AppointmentFileRef;
  onClose: () => void;
  clinicalContext?: ImagingClinicalContext;
  /** AI imaging analysis (live consult only). */
  aiEnabled?: boolean;
};

export function MedicalScanViewer({ file, onClose, clinicalContext, aiEnabled = false }: Props) {
  const label = file.title ?? file.name ?? "Scan";
  const href = resolveMediaUrl(file.url);
  const kind = medicalFileKind(label);
  const imagingType = imagingLabelFromName(label);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [scanning, setScanning] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const runScanAnimation = useCallback(() => {
    setScanning(true);
    window.setTimeout(() => setScanning(false), 2200);
  }, []);

  const runAiAnalysis = useCallback(async () => {
    if (kind !== "image") {
      setAiError("AI analysis needs a PNG/JPEG/WebP image. Export a snapshot from DICOM if needed.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiAnalysis(null);
    try {
      const imageFile = await fetchReportAsFile(file);
      const analysis = await analyzeMedicalScanWithAi(imageFile, {
        fileName: label,
        clinicalContext,
      });
      setAiAnalysis(analysis);
    } catch (e) {
      setAiError(userFacingError(e, "AI analysis failed."));
    } finally {
      setAiLoading(false);
    }
  }, [clinicalContext, file, kind, label]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filter = `brightness(${brightness}%) contrast(${contrast}%)${invert ? " invert(1)" : ""}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`View ${label}`}
    >
      <div className="mh-on-dark flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-slate-400">
              {imagingType} · view, enhance, and AI-assisted review (not a diagnosis)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_minmax(260px,320px)]">
          <div className="relative flex min-h-[240px] items-center justify-center overflow-auto bg-black p-4 lg:min-h-[320px]">
            {kind === "image" && href ? (
              <>
                <img
                  src={href}
                  alt={label}
                  className="max-h-[50vh] max-w-full object-contain transition-transform duration-200 lg:max-h-[55vh]"
                  style={{ filter, transform: `scale(${zoom})` }}
                />
                {scanning ? (
                  <div
                    className="pointer-events-none absolute inset-x-4 top-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_rgba(45,212,191,0.8)]"
                    style={{ animation: "scan-sweep 2s ease-in-out" }}
                  />
                ) : null}
              </>
            ) : kind === "dicom" ? (
              <p className="max-w-md px-6 text-center text-sm text-slate-300">
                DICOM must be opened in a PACS viewer. Ask the patient for a JPEG/PNG export for in-browser and AI
                review.
              </p>
            ) : (
              <p className="text-sm text-slate-400">Preview not available for this file type.</p>
            )}
          </div>

          <div className="flex flex-col border-t border-slate-700 bg-slate-900/95 lg:border-t-0 lg:border-l">
            {kind === "image" && href ? (
              <div className="shrink-0 space-y-2 border-b border-slate-700 p-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={runScanAnimation}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    <ScanLine className="h-3 w-3" />
                    Scan pass
                  </button>
                  {aiEnabled ? (
                    <button
                      type="button"
                      onClick={() => void runAiAnalysis()}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      AI analyze
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    className="rounded-lg border border-slate-600 p-1 text-slate-200 hover:bg-slate-800"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    className="rounded-lg border border-slate-600 p-1 text-slate-200 hover:bg-slate-800"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <label className="flex items-center gap-1 text-[10px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={invert}
                      onChange={(e) => setInvert(e.target.checked)}
                      className="rounded"
                    />
                    Invert
                  </label>
                </div>
                <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
                  Brightness {brightness}%
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
                  Contrast {contrast}%
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </label>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto p-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-violet-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI imaging summary
              </h3>
              <p className="mt-1 text-[10px] leading-snug text-slate-500">
                {aiEnabled
                  ? "Sends the image to MediHub AI (vision attachments). For physician review only — not a final diagnosis."
                  : "AI analysis is available during a live video consultation only."}
              </p>
              {aiError ? <p className="mt-2 text-xs text-red-300">{aiError}</p> : null}
              {aiLoading ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  Analyzing scan…
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-invert prose-sm mt-3 max-w-none text-xs text-slate-200">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              ) : aiEnabled ? (
                <p className="mt-3 text-xs text-slate-500">
                  Click <span className="font-semibold text-violet-300">AI analyze</span> to generate findings and
                  differentials from this {imagingType.toLowerCase()}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
