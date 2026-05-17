import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, SendHorizontal } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  sending,
  placeholder = "Message the assistant…",
  footerNote,
  className,
  maxWidthClass = "max-w-3xl",
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  footerNote?: string;
  className?: string;
  maxWidthClass?: string;
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void onSend();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  const isDisabled = Boolean(disabled || sending);

  return (
    <footer className={cn("shrink-0 border-t border-slate-100 bg-white/90 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:p-4", className)}>
      <form className={cn("relative mx-auto", maxWidthClass)} onSubmit={handleSubmit}>
        <Textarea
          className="min-h-[3.25rem] resize-none rounded-2xl border-slate-200 bg-white py-3 pl-4 pr-14 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          rows={2}
          dir="auto"
          enterKeyHint="send"
          inputMode="text"
          autoCapitalize="sentences"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon-lg"
          className="absolute bottom-2.5 right-2 rounded-xl shadow-md"
          disabled={isDisabled || !value.trim()}
          aria-label="Send"
        >
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : <SendHorizontal aria-hidden />}
        </Button>
      </form>
      {footerNote ? (
        <p className={cn("mx-auto mt-2 text-center text-[11px] text-slate-400", maxWidthClass)}>{footerNote}</p>
      ) : null}
    </footer>
  );
}
