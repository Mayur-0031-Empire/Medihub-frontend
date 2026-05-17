import {
  createAiChat,
  deleteAiChat,
  getAiChat,
  isServerConfigured,
  listAiChats,
  renameAiChat,
  sendAiChatMessage,
  userFacingError,
} from "@/lib/api";
import { SERVICE_UNAVAILABLE_CHAT } from "@/lib/userMessages";
import type { AiChatSummary, AiChatThread, AiMessage } from "@/types/aiChat";
import { mergeCareAssistantAfterNegativeUser } from "@/lib/ai";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { notifyError } from "@/lib/notify";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Bot,
  Loader2,
  Menu,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import type { DashboardOutletContext } from "@/pages/dashboard/context/outletContext";
import { btnIcon, iconBrand, surfaceInput, textHeading, textMuted, textSubtle } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { Link, useOutletContext } from "react-router-dom";

const SUGGESTIONS = [
  "How can I improve sleep quality?",
  "What does a balanced plate look like?",
  "Gentle ways to stay active at home",
  "When should I seek urgent care vs. routine care?",
];

function formatChatLabel(chat: AiChatSummary): string {
  const t = chat.title?.trim();
  if (t) return t;
  return "Conversation";
}

function formatShortTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AiChatPage() {
  const { user } = useOutletContext<DashboardOutletContext>();
  const serverOk = isServerConfigured();
  const [chats, setChats] = useState<AiChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [thread, setThread] = useState<AiChatThread | null>(null);
  const [composer, setComposer] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  const scrollThreadToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  const loadChats = useCallback(async () => {
    if (!serverOk) return;
    setListLoading(true);
    try {
      const rows = await listAiChats();
      setChats(rows);
    } catch (e) {
      notifyError(userFacingError(e, "Could not load conversations."));
    } finally {
      setListLoading(false);
    }
  }, [serverOk]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    scrollThreadToBottom();
  }, [thread?.messages, threadLoading, scrollThreadToBottom]);

  const displayMessages = useMemo(
    () => (thread?.messages?.length ? mergeCareAssistantAfterNegativeUser(thread.messages) : []),
    [thread],
  );

  async function openChat(chatId: string) {
    if (!serverOk) return;
    setActiveChatId(chatId);
    setMobileDrawerOpen(false);
    setThreadLoading(true);
    setRenaming(false);
    try {
      const t = await getAiChat(chatId);
      setThread(t);
    } catch (e) {
      notifyError(userFacingError(e, "Could not open this chat."));
      setThread(null);
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleNewChat() {
    if (!serverOk) return;
    setCreating(true);
    try {
      const id = await createAiChat();
      await loadChats();
      await openChat(id);
      setSidebarOpen(true);
    } catch (e) {
      notifyError(userFacingError(e, "Could not start a new chat."));
    } finally {
      setCreating(false);
    }
  }

  async function handleSend() {
    const text = composer.trim();
    if (!text || sending || !serverOk) return;
    setSending(true);
    try {
      const { chatId } = await sendAiChatMessage(activeChatId, text);
      setComposer("");
      setActiveChatId(chatId);
      const t = await getAiChat(chatId);
      setThread(t);
      await loadChats();
    } catch (e) {
      notifyError(userFacingError(e, "Could not send your message."));
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(chatId: string) {
    if (!serverOk) return;
    const ok = window.confirm("Delete this conversation? This cannot be undone.");
    if (!ok) return;
    try {
      await deleteAiChat(chatId);
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setThread(null);
        setRenaming(false);
      }
      await loadChats();
    } catch (e) {
      notifyError(userFacingError(e, "Could not delete the chat."));
    }
  }

  async function commitRename() {
    if (!activeChatId || !serverOk) return;
    const next = renameDraft.trim();
    if (!next) {
      setRenaming(false);
      return;
    }
    try {
      await renameAiChat(activeChatId, next);
      setRenaming(false);
      await loadChats();
      if (thread) setThread({ ...thread, title: next });
    } catch (e) {
      notifyError(userFacingError(e, "Could not rename the chat."));
    }
  }

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return tb - ta;
    });
  }, [chats]);

  const isPatient = user.role === "patient";

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">Care assistant</h1>
        <p className="mt-2 text-sm text-amber-900/90">
          {SERVICE_UNAVAILABLE_CHAT}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[min(720px,calc(100dvh-8rem))] max-w-6xl flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40 lg:flex-row">
      {/* Desktop sidebar */}
      <aside
        className={[
          "hidden shrink-0 flex-col border-slate-100 bg-gradient-to-b from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 lg:flex",
          sidebarOpen ? "w-72 border-r" : "w-0 overflow-hidden border-0",
        ].join(" ")}
      >
        <ChatSidebarContent
          chats={sortedChats}
          activeChatId={activeChatId}
          listLoading={listLoading}
          creating={creating}
          onNew={handleNewChat}
          onSelect={(id) => void openChat(id)}
          onDelete={(id) => void handleDelete(id)}
        />
      </aside>

      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col gap-0 p-0 lg:hidden">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">Conversations</p>
          <ChatSidebarContent
            chats={sortedChats}
            activeChatId={activeChatId}
            listLoading={listLoading}
            creating={creating}
            onNew={handleNewChat}
            onSelect={(id) => void openChat(id)}
            onDelete={(id) => void handleDelete(id)}
          />
        </SheetContent>
      </Sheet>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-950">
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-800 sm:px-5">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open conversations"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={cn(btnIcon, "hidden lg:inline-flex")}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            {renaming && activeChatId ? (
              <input
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => void commitRename()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void commitRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className={cn(
                  "w-full max-w-md rounded-xl border border-teal-200 px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-800",
                  surfaceInput,
                )}
                autoFocus
                aria-label="Chat title"
              />
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/25">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h1 className={cn("truncate text-base font-semibold sm:text-lg", textHeading)}>
                    {thread?.title ?? "Care assistant"}
                  </h1>
                  <p className={cn("truncate text-xs", textSubtle)}>
                    {isPatient
                      ? "General wellness information — not a substitute for your clinician."
                      : "General information only — follow your organization’s clinical policies."}
                  </p>
                </div>
                {activeChatId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRenameDraft(thread?.title ?? "");
                      setRenaming(true);
                    }}
                    className={cn(btnIcon, "ml-1 shrink-0 hover:text-teal-600 dark:hover:text-teal-400")}
                    aria-label="Rename chat"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          {threadLoading ? (
            <div className={cn("flex h-48 items-center justify-center gap-2", textMuted)}>
              <Loader2 className={cn("h-8 w-8 animate-spin", iconBrand)} aria-hidden />
              <span className="text-sm">Loading messages…</span>
            </div>
          ) : !thread || thread.messages.length === 0 ? (
            <EmptyThreadState
              onPick={(q) => {
                setComposer(q);
              }}
            />
          ) : (
            <MessageList messages={displayMessages} />
          )}
          <div ref={listEndRef} />
        </div>

        <ChatComposer
          value={composer}
          onChange={setComposer}
          onSend={handleSend}
          disabled={threadLoading}
          sending={sending}
          placeholder={
            activeChatId ? "Message the assistant…" : "Start a conversation — your first reply opens a saved thread."
          }
          footerNote="Do not share passwords or full medical records. For emergencies, contact local emergency services."
        />
      </section>
    </div>
  );
}

function ChatSidebarContent(props: {
  chats: AiChatSummary[];
  activeChatId: string | null;
  listLoading: boolean;
  creating: boolean;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { chats, activeChatId, listLoading, creating, onNew, onSelect, onDelete } = props;
  return (
    <>
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onNew}
          disabled={creating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
          New conversation
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {listLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className={cn("h-7 w-7 animate-spin", iconBrand)} aria-hidden />
          </div>
        ) : chats.length === 0 ? (
          <p className={cn("px-3 py-6 text-center text-sm", textSubtle)}>No saved chats yet. Start one to see it here.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {chats.map((c) => {
              const active = c._id === activeChatId;
              return (
                <li key={c._id}>
                  <div
                    className={[
                      "group flex items-stretch gap-1 rounded-xl border transition",
                      active
                        ? "border-teal-200 bg-teal-50/90 shadow-sm dark:border-teal-800 dark:bg-teal-950/50"
                        : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(c._id)}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">{formatChatLabel(c)}</span>
                      <span className="text-xs text-slate-500">{formatShortTime(c.updatedAt ?? c.createdAt)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c._id)}
                      className="shrink-0 rounded-r-xl px-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                      aria-label={`Delete ${formatChatLabel(c)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function EmptyThreadState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center sm:py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30">
        <Bot className="h-8 w-8" aria-hidden />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">How can we help today?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Ask about sleep, nutrition, activity, or how to get ready for an appointment. Tap a suggestion or write your own
        question below.
      </p>
      <div className="mt-8 flex w-full flex-col gap-2 sm:max-w-md">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-teal-700 dark:hover:bg-teal-950/40"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

const assistantMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed [&>p]:mb-0">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) =>
    href?.startsWith("/") ? (
      <Link
        to={href}
        className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800"
      >
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
  h1: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-slate-900 first:mt-0 dark:text-slate-100">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-slate-900 first:mt-0 dark:text-slate-100">{children}</h3>,
  h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-semibold text-slate-900 first:mt-0 dark:text-slate-100">{children}</h3>,
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-slate-900/90 p-3 text-xs text-slate-100">{children}</pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.startsWith("language-"));
    if (isBlock) {
      return (
        <code className={`${className ?? ""} block whitespace-pre text-slate-100`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-800 dark:bg-slate-800 dark:text-slate-200" {...props}>
        {children}
      </code>
    );
  },
};

function MessageList({ messages }: { messages: AiMessage[] }) {
  return (
    <ul className="mx-auto flex max-w-3xl flex-col gap-3">
      {messages.map((m) => (
        <li
          key={m.id}
          className={["flex w-full", m.role === "user" ? "justify-end" : "justify-start"].join(" ")}
        >
          <div
            className={[
              "max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
              m.role === "user"
                ? "rounded-br-md bg-teal-600 text-white"
                : m.role === "system"
                  ? "rounded-bl-md border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
            ].join(" ")}
          >
            {m.role === "assistant" ? (
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Assistant
              </div>
            ) : null}
            {m.role === "user" ? (
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            ) : (
              <div className="break-words [&_li>p]:inline">
                <ReactMarkdown components={assistantMarkdownComponents}>{m.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
