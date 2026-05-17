import type { AiChatSummary, AiChatThread, AiMessage, AiMessageRole } from "@/types/aiChat";

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

function idFrom(row: Record<string, unknown>): string | undefined {
  const id = stringField(row, "_id", "id", "chatId");
  return id;
}

export function extractChatListPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  for (const k of ["chats", "items", "results", "rows"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(o.data)) return o.data as unknown[];
  const inner = asRecord(o.data);
  if (inner) {
    for (const k of ["chats", "items"]) {
      const v = inner[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

export function normalizeChatSummary(row: unknown): AiChatSummary | null {
  const o = asRecord(row);
  if (!o) return null;
  const _id = idFrom(o);
  if (!_id) return null;
  return {
    _id,
    title: stringField(o, "title", "name", "subject"),
    updatedAt: stringField(o, "updatedAt", "updated_at", "lastMessageAt"),
    createdAt: stringField(o, "createdAt", "created_at"),
  };
}

function inferRole(o: Record<string, unknown>): AiMessageRole {
  const r = stringField(o, "role", "sender", "from")?.toLowerCase();
  if (r === "user" || r === "patient" || r === "human") return "user";
  if (r === "system") return "system";
  if (r === "assistant" || r === "ai" || r === "bot" || r === "model") return "assistant";
  if (o.isUser === true || o.fromUser === true) return "user";
  if (o.isAssistant === true || o.isBot === true) return "assistant";
  return "assistant";
}

function messageContent(o: Record<string, unknown>): string {
  const c = stringField(o, "content", "text", "body", "message", "markdown");
  return (c ?? "").trim();
}

export function normalizeMessage(row: unknown, index: number): AiMessage | null {
  const o = asRecord(row);
  if (!o) return null;
  const content = messageContent(o);
  if (!content) return null;
  const id = stringField(o, "_id", "id", "messageId") ?? `m-${index}-${content.slice(0, 8)}`;
  return {
    id,
    role: inferRole(o),
    content,
    createdAt: stringField(o, "createdAt", "created_at", "timestamp"),
  };
}

export function extractMessagesArray(chat: unknown): unknown[] {
  const o = asRecord(chat);
  if (!o) return [];
  for (const k of ["messages", "history", "thread", "items"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  const inner = asRecord(o.chat);
  if (inner) {
    const v = inner.messages;
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function normalizeChatThread(chat: unknown): AiChatThread | null {
  const o = asRecord(chat);
  if (!o) return null;
  const inner = asRecord(o.chat) ?? o;
  const chatId = idFrom(inner) ?? idFrom(o);
  if (!chatId) return null;
  const title = stringField(inner, "title", "name", "subject") ?? "Conversation";
  const rawMsgs = extractMessagesArray(o.chat ?? o);
  const messages: AiMessage[] = [];
  rawMsgs.forEach((row, i) => {
    const m = normalizeMessage(row, i);
    if (m) messages.push(m);
  });
  return { chatId, title, messages };
}

export function extractChatIdFromSendResponse(data: unknown): string | null {
  const o = asRecord(data);
  if (!o) return null;
  const direct = stringField(o, "chatId", "chat_id");
  if (direct) return direct;
  const chat = asRecord(o.chat) ?? asRecord(o.data);
  if (chat) {
    const id = idFrom(chat);
    if (id) return id;
  }
  const inner = asRecord(o.data);
  if (inner) {
    const c = asRecord(inner.chat);
    if (c) {
      const id = idFrom(c);
      if (id) return id;
    }
    const id = idFrom(inner);
    if (id) return id;
  }
  return null;
}
