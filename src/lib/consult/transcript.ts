/** Short timestamp for transcript lines, e.g. 14:05 */
export function formatTranscriptTimestamp(date = new Date()): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function appendTranscriptLine(existing: string, text: string, date = new Date()): string {
  const trimmed = text.trim();
  if (!trimmed) return existing;
  const line = `[${formatTranscriptTimestamp(date)}] ${trimmed}`;
  return existing ? `${existing}\n${line}` : line;
}

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}
