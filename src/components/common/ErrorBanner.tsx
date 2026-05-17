import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export function ErrorBanner({
  message,
  className,
  title,
}: {
  message: string;
  className?: string;
  title?: string;
}) {
  return (
    <Alert variant="destructive" className={cn("border-red-200 bg-red-50 text-red-800", className)} role="alert">
      <AlertCircle className="text-red-700" aria-hidden />
      {title ? <p className="font-medium">{title}</p> : null}
      <AlertDescription className="text-red-800">{message}</AlertDescription>
    </Alert>
  );
}
