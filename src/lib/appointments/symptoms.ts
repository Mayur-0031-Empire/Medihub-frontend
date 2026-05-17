/** Display text for symptoms from API (string or string[]). */
export function formatSymptomsForDisplay(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : undefined;
  }
  return undefined;
}

/** MediHub book API expects symptoms as a string array. */
export function symptomsForBookApi(input: string | string[] | undefined): string[] | undefined {
  if (input == null) return undefined;
  if (Array.isArray(input)) {
    const parts = input.map((s) => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts : undefined;
  }
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const lines = trimmed
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [trimmed];
}
