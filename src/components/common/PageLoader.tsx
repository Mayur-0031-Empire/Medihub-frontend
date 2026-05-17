import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function PageLoader({
  label = "Loading…",
  className,
  variant = "spinner",
}: {
  label?: string;
  className?: string;
  variant?: "spinner" | "skeleton";
}) {
  const busyProps = { "aria-busy": true as const, "aria-live": "polite" as const, "aria-label": label };

  if (variant === "skeleton") {
    return (
      <div className={cn("mx-auto flex w-full max-w-md flex-col gap-3 py-12", className)} {...busyProps}>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)} {...busyProps}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
