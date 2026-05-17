import { userFacingError } from "@/lib/userMessages";
import { extractTextFromDocument } from "@/lib/appointments/documentText";
import { countFilledVitals, parseVitalsFromDocumentText } from "@/lib/appointments/vitals";
import type { PatientVitals } from "@/types/vitals";
import { VITAL_FIELD_LABELS } from "@/types/vitals";
import { FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/15";

type Props = {
  vitals: PatientVitals;
  onVitalsChange: (vitals: PatientVitals) => void;
  disabled?: boolean;
};

export function DocumentVitalsIntake({ vitals, onVitalsChange, disabled }: Props) {
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onDocumentSelected(file: File | null) {
    if (!file || disabled) return;
    setParsing(true);
    setParseMessage(null);
    setFileName(file.name);
    try {
      const text = await extractTextFromDocument(file);
      const extracted = parseVitalsFromDocumentText(text);
      const merged = { ...vitals, ...extracted };
      onVitalsChange(merged);
      const count = countFilledVitals(extracted);
      if (count === 0) {
        setParseMessage(
          "Document read successfully, but no vitals were detected. Try a lab report with labels like BP, weight, cholesterol, or LDL/HDL.",
        );
      } else {
        setParseMessage(`Filled ${count} field${count === 1 ? "" : "s"} from ${file.name}. Review below, then save notes.`);
      }
    } catch (e) {
      setParseMessage(userFacingError(e, "Could not read document."));
    } finally {
      setParsing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-gradient-to-b from-teal-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
          <Upload className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">Import vitals from document</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload a lab report or clinical summary (PDF or text). BP, weight, cholesterol, glucose, and related
            values are extracted automatically.
          </p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-300/80 bg-white/80 px-4 py-8 text-center transition hover:border-teal-500 hover:bg-white">
        <input
          type="file"
          accept=".pdf,.txt,.csv,text/plain,application/pdf"
          className="sr-only"
          disabled={disabled || parsing}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            void onDocumentSelected(f);
            e.target.value = "";
          }}
        />
        {parsing ? (
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-label="Reading document" />
        ) : (
          <FileText className="h-8 w-8 text-teal-600" aria-hidden />
        )}
        <span className="mt-2 text-sm font-semibold text-teal-900">
          {parsing ? "Reading document…" : "Choose PDF or text report"}
        </span>
        {fileName ? <span className="mt-1 text-xs text-slate-500">{fileName}</span> : null}
      </label>

      {parseMessage ? (
        <p
          className={[
            "mt-3 rounded-lg px-3 py-2 text-sm",
            parseMessage.includes("Filled") ? "bg-teal-100 text-teal-950" : "bg-amber-50 text-amber-950",
          ].join(" ")}
        >
          {parseMessage}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {VITAL_FIELD_LABELS.map(({ key, label, placeholder }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700">{label}</span>
            <input
              className={inputClass}
              value={vitals[key] ?? ""}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(e) => onVitalsChange({ ...vitals, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
