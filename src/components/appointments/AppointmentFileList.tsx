import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { AppointmentFileRef } from "@/types/appointment";
import { FileText } from "lucide-react";

type Props = {
  files: AppointmentFileRef[];
  emptyMessage?: string;
};

export function AppointmentFileList({ files, emptyMessage }: Props) {
  if (files.length === 0) {
    return emptyMessage ? <p className="text-sm text-slate-600">{emptyMessage}</p> : null;
  }
  return (
    <ul className="space-y-2">
      {files.map((f, i) => {
        const href = resolveMediaUrl(f.url);
        const label = f.title ?? f.name ?? `Document ${i + 1}`;
        return (
          <li key={`${label}-${i}`}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" aria-hidden />
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
