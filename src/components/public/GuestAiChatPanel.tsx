import {getAiChat, isServerConfigured, sendAiChatMessage, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE_CHAT } from "@/lib/userMessages";
import type { AiMessage } from "@/types/aiChat";
import { mergeCareAssistantAfterNegativeUser } from "@/lib/ai";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { notifyError } from "@/lib/notify";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

const GUEST_CHAT_ID_KEY = "medihub-guest-chat-id";

const SUGGESTIONS = [
  "How can I improve sleep quality?",
  "What does a balanced plate look like?",
  "When should I seek urgent care?",
];

const assistantMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed [&>p]:mb-0">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  a: ({ href, children }) =>
    href?.startsWith("/") ? (
      <Link to={href} className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800">
        {children}
      </Link>
    ) : (
      <a
        href={href}
        className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
};

function MessageList({ messages }: { messages: AiMessage[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {messages.map((m) => (
        <li key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div
            className={[
              "max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
              m.role === "user"
                ? "rounded-br-md bg-teal-600 text-white"
                : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800",
            ].join(" ")}
          >
            {m.role === "assistant" ? (
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Assistant
              </div>
            ) : null}
            {m.role === "user" ? (
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            ) : (
              <ReactMarkdown components={assistantMarkdownComponents}>{m.content}</ReactMarkdown>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Guest care assistant — no sign-in; uses aggregate AI message endpoint when the server allows it. */
export function GuestAiChatPanel() {
  const serverOk = isServerConfigured();
  const [chatId, setChatId] = useState<string | null>(() => sessionStorage.getItem(GUEST_CHAT_ID_KEY));
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const displayMessages = useMemo(
    () => (messages.length ? mergeCareAssistantAfterNegativeUser(messages) : []),
    [messages],
  );

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, sending, scrollToBottom]);

  useEffect(() => {
    if (!serverOk || !chatId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const thread = await getAiChat(chatId);
        if (!cancelled) setMessages(thread.messages);
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(GUEST_CHAT_ID_KEY);
          setChatId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverOk, chatId]);

  async function handleSend() {
    const text = composer.trim();
    if (!text || sending || !serverOk) return;
    setSending(true);
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, role: "user", content: text }]);
    setComposer("");
    try {
      const { chatId: nextId, thread } = await sendAiChatMessage(chatId, text);
      setChatId(nextId);
      sessionStorage.setItem(GUEST_CHAT_ID_KEY, nextId);
      if (thread?.messages?.length) {
        setMessages(thread.messages);
      } else {
        const refreshed = await getAiChat(nextId);
        setMessages(refreshed.messages);
      }
    } catch (e) {
      const msg = userFacingError(e, "Could not send your message.");
      const needsAuth = /401|403|unauthorized|sign in|login/i.test(msg);
      notifyError(
        needsAuth
          ? "Sign in to use the full assistant and save conversations. You can still register free below."
          : msg,
      );
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setComposer(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      id="home-chatbot"
      className="flex h-[min(520px,70vh)] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-4 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/25">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">AI care assistant</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">No sign-in · general wellness info only</p>
        </div>
        <Link
          to="/login?portal=patient"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Sign in to save chats
        </Link>
      </header>

      {!serverOk ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-amber-950">
          <p>
            {SERVICE_UNAVAILABLE_CHAT}
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {loading ? (
              <div className="flex h-40 items-center justify-center gap-2 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-hidden />
                <span className="text-sm">Loading…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
                  <Bot className="h-7 w-7" aria-hidden />
                </div>
                <p className="mt-4 text-sm text-slate-600">Ask a health question — no account needed to try it.</p>
                <div className="mt-4 flex w-full max-w-md flex-col gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setComposer(q)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-800 hover:border-teal-300 hover:bg-teal-50/50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <MessageList messages={displayMessages} />
            )}
            <div ref={listEndRef} />
          </div>

          <ChatComposer
            value={composer}
            onChange={setComposer}
            onSend={handleSend}
            disabled={loading}
            sending={sending}
            placeholder="Ask the assistant…"
            maxWidthClass="w-full"
            footerNote="Not medical advice. For emergencies, call your local emergency number."
          />
        </>
      )}
    </div>
  );
}
