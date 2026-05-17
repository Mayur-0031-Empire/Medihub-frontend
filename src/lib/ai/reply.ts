import type { AiChatThread } from "@/types/aiChat";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function stringField(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Last assistant message in a normalized thread. */
export function latestAssistantReply(thread: AiChatThread | undefined): string | null {
  if (!thread?.messages.length) return null;
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const m = thread.messages[i];
    if (m.role === "assistant" && m.content.trim()) return m.content.trim();
  }
  return null;
}

/** Fallback when the send response nests the reply outside messages[]. */
export function extractReplyFromPayload(data: unknown): string | null {
  const o = asRecord(data);
  if (!o) return null;
  const direct =
    stringField(o, "reply", "response", "answer", "content", "text", "message", "analysis") ??
    stringField(asRecord(o.data) ?? {}, "reply", "response", "answer", "content", "text");
  return direct ?? null;
}
