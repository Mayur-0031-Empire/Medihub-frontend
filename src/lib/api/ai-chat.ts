import type { AiChatSummary, AiChatThread } from "@/types/aiChat";
import {
  assertMedihubServerConfigured,
  aiChatByIdPath,
  aiChatMessagesPath,
  aiChatsCollectionPath,
  aiChatsMessagesAggregatePath,
} from "@/lib/config";
import {
  extractChatIdFromSendResponse,
  extractChatListPayload,
  normalizeChatSummary,
  normalizeChatThread,
} from "@/lib/ai/normalize";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

export async function listAiChats(): Promise<AiChatSummary[]> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${aiChatsCollectionPath()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not list chats`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const rows = extractChatListPayload(raw.data);
  const out: AiChatSummary[] = [];
  for (const row of rows) {
    const s = normalizeChatSummary(row);
    if (s) out.push(s);
  }
  return out;
}

export async function getAiChat(chatId: string): Promise<AiChatThread> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${aiChatByIdPath(chatId)}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load chat`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const thread = normalizeChatThread(raw.data);
  if (!thread) {
    throw new Error("Unexpected chat response.");
  }
  return thread;
}

export async function createAiChat(title?: string): Promise<string> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${aiChatsCollectionPath()}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(title?.trim() ? { title: title.trim() } : {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not create chat`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const id = extractChatIdFromSendResponse(raw.data);
  if (id) return id;
  const t = normalizeChatThread(raw.data) ?? normalizeChatThread({ chat: raw.data });
  if (t) return t.chatId;
  throw new Error("Unexpected create chat response.");
}

/** Send a message with image/file attachments (multipart) per AI Chat API. */
export async function sendAiChatMessageWithAttachments(
  chatId: string | null,
  text: string,
  files: File[],
): Promise<{ chatId: string; thread?: AiChatThread; data?: unknown }> {
  const base = assertMedihubServerConfigured();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }
  if (files.length === 0) {
    throw new Error("At least one attachment is required.");
  }
  const form = new FormData();
  form.append("message", trimmed);
  for (const f of files) {
    form.append("attachments", f);
  }
  const url = chatId ? `${base}${aiChatMessagesPath(chatId)}` : `${base}${aiChatsMessagesAggregatePath()}`;
  const res = await medihubFetch(url, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Send failed`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const thread = normalizeChatThread(raw.data) ?? normalizeChatThread({ chat: raw.data });
  const cid = thread?.chatId ?? extractChatIdFromSendResponse(raw.data) ?? chatId;
  if (!cid) {
    throw new Error("Unexpected send response.");
  }
  return { chatId: cid, thread: thread ?? undefined, data: raw.data };
}

export async function sendAiChatMessage(
  chatId: string | null,
  text: string,
): Promise<{ chatId: string; thread?: AiChatThread }> {
  const base = assertMedihubServerConfigured();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }
  const url = chatId ? `${base}${aiChatMessagesPath(chatId)}` : `${base}${aiChatsMessagesAggregatePath()}`;
  const res = await medihubFetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: trimmed }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Send failed`));
  }
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const thread = normalizeChatThread(raw.data) ?? normalizeChatThread({ chat: raw.data });
  const cid = thread?.chatId ?? extractChatIdFromSendResponse(raw.data) ?? chatId;
  if (!cid) {
    throw new Error("Unexpected send response.");
  }
  return { chatId: cid, thread: thread ?? undefined };
}

export async function deleteAiChat(chatId: string): Promise<void> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${aiChatByIdPath(chatId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(formatApiFailure(body, `Delete failed`));
  }
}

export async function renameAiChat(chatId: string, title: string): Promise<void> {
  const base = assertMedihubServerConfigured();
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Title cannot be empty.");
  }
  const res = await medihubFetch(`${base}${aiChatByIdPath(chatId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: trimmed }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Rename failed`));
  }
  if (body !== null && typeof body === "object") {
    const raw = unwrapData<unknown>(body);
    if (!raw.ok) {
      throw new Error(raw.message);
    }
  }
}
