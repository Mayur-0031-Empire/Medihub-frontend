import { CircleCheck, Info, Loader2, OctagonX, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      expand
      richColors
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-4" aria-hidden />,
        info: <Info className="size-4" aria-hidden />,
        warning: <TriangleAlert className="size-4" aria-hidden />,
        error: <OctagonX className="size-4" aria-hidden />,
        loading: <Loader2 className="size-4 animate-spin" aria-hidden />,
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
}
