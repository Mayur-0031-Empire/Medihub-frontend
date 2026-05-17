/** Adult BMI from height (cm) and weight (kg). */
export function computeBmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export type BmiCategoryKey = "underweight" | "normal" | "overweight" | "obese";

export function categoryFromBmi(bmi: number): { key: BmiCategoryKey; label: string } {
  if (bmi < 18.5) return { key: "underweight", label: "Underweight" };
  if (bmi < 25) return { key: "normal", label: "Normal weight" };
  if (bmi < 30) return { key: "overweight", label: "Overweight" };
  return { key: "obese", label: "Obese" };
}

/**
 * Turns each `requiredParameters` entry from `GET /api/bmi-buddy` into a single readable line.
 * APIs may send strings or objects like `{ name, label, unit, type }`.
 */
export function formatBmiRequiredParameterLine(raw: unknown): string {
  if (typeof raw === "string") {
    return raw.trim();
  }
  if (!raw || typeof raw !== "object") {
    return "";
  }
  const o = raw as Record<string, unknown>;
  const key = o.key ?? o.name ?? o.field ?? o.id;
  const label = o.label ?? o.title ?? o.description;

  const namePart =
    typeof label === "string" && label.trim()
      ? label.trim()
      : typeof key === "string" && key.trim()
        ? key.trim()
        : "";
  if (!namePart) {
    try {
      return JSON.stringify(o);
    } catch {
      return "";
    }
  }

  const unit = o.unit ?? o.units;
  const type = o.type;
  const extras: string[] = [];
  if (typeof unit === "string" && unit.trim()) extras.push(unit.trim());
  if (typeof type === "string" && type.trim()) extras.push(type.trim());
  if (extras.length) {
    return `${namePart} (${extras.join(", ")})`;
  }
  return namePart;
}
