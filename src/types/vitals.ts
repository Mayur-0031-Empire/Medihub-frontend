/** Key clinical values extracted from documents or entered by the doctor. */
export interface PatientVitals {
  bloodPressure?: string;
  weightKg?: string;
  heightCm?: string;
  cholesterolTotal?: string;
  cholesterolLdl?: string;
  cholesterolHdl?: string;
  triglycerides?: string;
  bloodSugarFasting?: string;
  bloodSugarRandom?: string;
  hba1c?: string;
  heartRate?: string;
  temperatureC?: string;
  spo2?: string;
}

export const EMPTY_VITALS: PatientVitals = {};

export const VITAL_FIELD_LABELS: { key: keyof PatientVitals; label: string; placeholder: string }[] = [
  { key: "bloodPressure", label: "Blood pressure", placeholder: "e.g. 120/80 mmHg" },
  { key: "weightKg", label: "Weight (kg)", placeholder: "e.g. 72" },
  { key: "heightCm", label: "Height (cm)", placeholder: "e.g. 170" },
  { key: "cholesterolTotal", label: "Total cholesterol", placeholder: "e.g. 190 mg/dL" },
  { key: "cholesterolLdl", label: "LDL cholesterol", placeholder: "e.g. 110 mg/dL" },
  { key: "cholesterolHdl", label: "HDL cholesterol", placeholder: "e.g. 55 mg/dL" },
  { key: "triglycerides", label: "Triglycerides", placeholder: "e.g. 140 mg/dL" },
  { key: "bloodSugarFasting", label: "Fasting blood sugar", placeholder: "e.g. 95 mg/dL" },
  { key: "bloodSugarRandom", label: "Random blood sugar", placeholder: "e.g. 110 mg/dL" },
  { key: "hba1c", label: "HbA1c", placeholder: "e.g. 5.6%" },
  { key: "heartRate", label: "Heart rate", placeholder: "e.g. 78 bpm" },
  { key: "temperatureC", label: "Temperature (°C)", placeholder: "e.g. 37.0" },
  { key: "spo2", label: "SpO₂", placeholder: "e.g. 98%" },
];
