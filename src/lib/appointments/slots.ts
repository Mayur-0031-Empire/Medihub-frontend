import type { AppointmentSlot, AppointmentSlotInput } from "@/types/appointment";

function startMs(iso: string): number {
  return new Date(iso).getTime();
}

/** Drop slots that match an existing open slot or duplicate rows in the same publish batch. */
export function filterNewSlotInputs(
  candidates: AppointmentSlotInput[],
  existing: AppointmentSlot[],
): AppointmentSlotInput[] {
  const existingStarts = new Set(
    existing.map((s) => startMs(s.startAt)).filter((t) => Number.isFinite(t)),
  );
  const seen = new Set<number>();
  const out: AppointmentSlotInput[] = [];
  for (const slot of candidates) {
    const t = startMs(slot.startAt);
    if (!Number.isFinite(t) || existingStarts.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(slot);
  }
  return out;
}

export function dedupeSlotInputs(slots: AppointmentSlotInput[]): AppointmentSlotInput[] {
  const seen = new Set<number>();
  return slots.filter((s) => {
    const t = startMs(s.startAt);
    if (!Number.isFinite(t) || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

export function isSlotDuplicateError(message: string): boolean {
  return /already exists|duplicate|e11000|unique constraint/i.test(message);
}
