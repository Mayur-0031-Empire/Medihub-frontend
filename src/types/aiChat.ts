export type AiMessageRole = "user" | "assistant" | "system";

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt?: string;
}

export interface AiChatSummary {
  _id: string;
  title?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface AiChatThread {
  chatId: string;
  title: string;
  messages: AiMessage[];
}
