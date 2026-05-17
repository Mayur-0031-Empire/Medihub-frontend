import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? <Icon className="mx-auto h-10 w-10 text-slate-400" aria-hidden /> : null}
      <p className={cn("font-medium text-slate-800", Icon && "mt-3")}>{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      {children}
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionTo ? (
        <Button type="button" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
