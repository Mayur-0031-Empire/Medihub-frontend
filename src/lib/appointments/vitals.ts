import type { PatientVitals } from "@/types/vitals";

const VITALS_BLOCK_START = "--- MediHub Vitals ---";
const VITALS_BLOCK_END = "--- End Vitals ---";

export function vitalsToNotesBlock(vitals: PatientVitals): string {
  const cleaned: PatientVitals = {};
  for (const [k, v] of Object.entries(vitals)) {
    if (v?.trim()) cleaned[k as keyof PatientVitals] = v.trim();
  }
  if (Object.keys(cleaned).length === 0) return "";
  return `${VITALS_BLOCK_START}\n${JSON.stringify(cleaned)}\n${VITALS_BLOCK_END}`;
}

export function parseVitalsFromNotes(notes: string | undefined): {
  vitals: PatientVitals;
  clinicalNotes: string;
} {
  if (!notes?.trim()) return { vitals: {}, clinicalNotes: "" };
  const start = notes.indexOf(VITALS_BLOCK_START);
  const end = notes.indexOf(VITALS_BLOCK_END);
  if (start === -1 || end === -1 || end <= start) {
    return { vitals: {}, clinicalNotes: notes.trim() };
  }
  const jsonPart = notes.slice(start + VITALS_BLOCK_START.length, end).trim();
  let vitals: PatientVitals = {};
  try {
    const parsed = JSON.parse(jsonPart) as PatientVitals;
    if (parsed && typeof parsed === "object") vitals = parsed;
  } catch {
    /* ignore */
  }
  const before = notes.slice(0, start).trim();
  const after = notes.slice(end + VITALS_BLOCK_END.length).trim();
  const clinicalNotes = [before, after].filter(Boolean).join("\n\n").trim();
  return { vitals, clinicalNotes };
}

export function mergeNotesWithVitals(clinicalNotes: string, vitals: PatientVitals): string {
  const block = vitalsToNotesBlock(vitals);
  const base = clinicalNotes.trim();
  if (!block) return base;
  if (!base) return block;
  return `${base}\n\n${block}`;
}

/** Extract common lab values from free text (reports, PDFs, discharge summaries). */
export function parseVitalsFromDocumentText(text: string): PatientVitals {
  const t = text.replace(/\s+/g, " ");
  const vitals: PatientVitals = {};

  const bp =
    t.match(/\b(?:bp|blood\s*pressure)\s*[:-]?\s*(\d{2,3}\s*\/\s*\d{2,3})\b/i)?.[1] ??
    t.match(/\b(\d{2,3}\s*\/\s*\d{2,3})\s*(?:mm\s*hg|mmhg)\b/i)?.[1];
  if (bp) vitals.bloodPressure = bp.replace(/\s/g, "");

  const weight =
    t.match(/\b(?:weight|body\s*weight|wt\.?)\s*[:-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:kg|kgs|kilograms?)\b/i)?.[1] ??
    t.match(/\b(\d{2,3}(?:\.\d{1,2})?)\s*kg\b/i)?.[1];
  if (weight) vitals.weightKg = weight;

  const height =
    t.match(/\b(?:height|ht\.?)\s*[:-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:cm|centimeters?)\b/i)?.[1] ??
    t.match(/\b(\d{2,3})\s*cm\b/i)?.[1];
  if (height) vitals.heightCm = height;

  const cholTotal =
    t.match(/\b(?:total\s*)?cholesterol\s*[:-]?\s*(\d{2,3}(?:\.\d+)?)\b/i)?.[1] ??
    t.match(/\bchol(?:esterol)?\s*(?:total)?\s*[:-]?\s*(\d{2,3})\b/i)?.[1];
  if (cholTotal) vitals.cholesterolTotal = cholTotal;

  const ldl = t.match(/\bldl\s*[:-]?\s*(\d{2,3}(?:\.\d+)?)\b/i)?.[1];
  if (ldl) vitals.cholesterolLdl = ldl;

  const hdl = t.match(/\bhdl\s*[:-]?\s*(\d{2,3}(?:\.\d+)?)\b/i)?.[1];
  if (hdl) vitals.cholesterolHdl = hdl;

  const tg = t.match(/\b(?:triglycerides?|tg)\s*[:-]?\s*(\d{2,3}(?:\.\d+)?)\b/i)?.[1];
  if (tg) vitals.triglycerides = tg;

  const fbs =
    t.match(/\b(?:fbs|fasting\s*(?:blood\s*)?sugar|fasting\s*glucose)\s*[:-]?\s*(\d{2,3}(?:\.\d+)?)\b/i)?.[1] ??
    t.match(/\bglucose\s*\(fasting\)\s*[:-]?\s*(\d{2,3})\b/i)?.[1];
  if (fbs) vitals.bloodSugarFasting = fbs;

  const rbs = t.match(/\b(?:rbs|random\s*(?:blood\s*)?sugar)\s*[:-]?\s*(\d{2,3}(?:\.\d+)?)\b/i)?.[1];
  if (rbs) vitals.bloodSugarRandom = rbs;

  const hba1c = t.match(/\b(?:hba1c|hb\s*a1c|glycated\s*hemoglobin)\s*[:-]?\s*(\d{1,2}(?:\.\d+)?)\s*%?/i)?.[1];
  if (hba1c) vitals.hba1c = hba1c.includes("%") ? hba1c : `${hba1c}%`;

  const hr = t.match(/\b(?:heart\s*rate|pulse|hr)\s*[:-]?\s*(\d{2,3})\s*(?:bpm)?\b/i)?.[1];
  if (hr) vitals.heartRate = hr;

  const temp = t.match(/\b(?:temp(?:erature)?|body\s*temp)\s*[:-]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:°?\s*c|celsius)?\b/i)?.[1];
  if (temp) vitals.temperatureC = temp;

  const spo2 = t.match(/\b(?:spo2|sp\s*o2|oxygen\s*saturation)\s*[:-]?\s*(\d{2,3})\s*%?\b/i)?.[1];
  if (spo2) vitals.spo2 = spo2.includes("%") ? spo2 : `${spo2}%`;

  return vitals;
}

export function countFilledVitals(vitals: PatientVitals): number {
  return Object.values(vitals).filter((v) => v?.trim()).length;
}

export function vitalsSummaryForAi(vitals: PatientVitals): string {
  const lines: string[] = [];
  if (vitals.bloodPressure) lines.push(`Blood pressure: ${vitals.bloodPressure}`);
  if (vitals.weightKg) lines.push(`Weight: ${vitals.weightKg} kg`);
  if (vitals.heightCm) lines.push(`Height: ${vitals.heightCm} cm`);
  if (vitals.cholesterolTotal) lines.push(`Total cholesterol: ${vitals.cholesterolTotal}`);
  if (vitals.cholesterolLdl) lines.push(`LDL: ${vitals.cholesterolLdl}`);
  if (vitals.cholesterolHdl) lines.push(`HDL: ${vitals.cholesterolHdl}`);
  if (vitals.triglycerides) lines.push(`Triglycerides: ${vitals.triglycerides}`);
  if (vitals.bloodSugarFasting) lines.push(`Fasting glucose: ${vitals.bloodSugarFasting}`);
  if (vitals.bloodSugarRandom) lines.push(`Random glucose: ${vitals.bloodSugarRandom}`);
  if (vitals.hba1c) lines.push(`HbA1c: ${vitals.hba1c}`);
  if (vitals.heartRate) lines.push(`Heart rate: ${vitals.heartRate} bpm`);
  if (vitals.temperatureC) lines.push(`Temperature: ${vitals.temperatureC} °C`);
  if (vitals.spo2) lines.push(`SpO2: ${vitals.spo2}`);
  return lines.join("\n");
}
