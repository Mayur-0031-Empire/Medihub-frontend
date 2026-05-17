import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { AppointmentFileRef } from "@/types/appointment";
import { FileText, Loader2, Trash2 } from "lucide-react";

type Props = {
  files: AppointmentFileRef[];
  deletingIndex: number | null;
  disabled?: boolean;
  onDelete: (file: AppointmentFileRef, index: number) => void;
};

export function DoctorAppointmentFileList({ files, deletingIndex, disabled, onDelete }: Props) {
  if (files.length === 0) return null;

  return (
    <ul className="space-y-2">
      {files.map((f, index) => {
        const href = resolveMediaUrl(f.url);
        const label = f.title ?? f.name ?? `Document ${index + 1}`;
        const isDeleting = deletingIndex === index;

        return (
          <li
            key={f._id ?? f.url ?? `${label}-${index}`}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
          >
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-sm font-medium text-teal-800 hover:bg-teal-50 rounded-md"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </a>
            ) : (
              <span className="inline-flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-sm text-slate-700">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            )}
            <button
              type="button"
              disabled={disabled || isDeleting}
              onClick={() => onDelete(f, index)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              aria-label={`Remove ${label}`}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
