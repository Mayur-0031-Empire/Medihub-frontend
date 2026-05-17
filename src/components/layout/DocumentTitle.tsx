import { useEffect } from "react";

const DEFAULT_TITLE = "MediHub";

export function DocumentTitle({ title }: { title?: string }) {
  useEffect(() => {
    const next = title ? `${title} — ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    document.title = next;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);

  return null;
}
