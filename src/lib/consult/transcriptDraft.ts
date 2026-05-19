const STORAGE_PREFIX = "medihub_consult_transcript:";

type TranscriptDraft = {
  text: string;
  updatedAt: number;
};

function keyFor(appointmentId: string): string {
  return `${STORAGE_PREFIX}${appointmentId}`;
}

function parseDraft(raw: string | null): TranscriptDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TranscriptDraft>;
    if (typeof parsed.text === "string" && typeof parsed.updatedAt === "number") {
      return { text: parsed.text, updatedAt: parsed.updatedAt };
    }
  } catch {
    /* ignore corrupt local draft */
  }
  return null;
}

export function readTranscriptDraft(appointmentId: string): TranscriptDraft | null {
  if (!appointmentId || typeof window === "undefined") return null;
  try {
    return parseDraft(window.localStorage.getItem(keyFor(appointmentId)));
  } catch {
    return null;
  }
}

export function writeTranscriptDraft(appointmentId: string, text: string): void {
  if (!appointmentId || typeof window === "undefined") return;
  try {
    if (!text.trim()) {
      window.localStorage.removeItem(keyFor(appointmentId));
      return;
    }
    window.localStorage.setItem(
      keyFor(appointmentId),
      JSON.stringify({ text, updatedAt: Date.now() } satisfies TranscriptDraft),
    );
  } catch {
    /* storage may be disabled */
  }
}

export function clearTranscriptDraft(appointmentId: string): void {
  if (!appointmentId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(appointmentId));
  } catch {
    /* storage may be disabled */
  }
}

export function preferTranscriptDraft(appointmentId: string, serverText: string): string {
  const draft = readTranscriptDraft(appointmentId);
  if (!draft?.text.trim()) return serverText;
  if (!serverText.trim()) return draft.text;
  return draft.text.length > serverText.length ? draft.text : serverText;
}
