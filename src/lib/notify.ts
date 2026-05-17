import { toast } from "sonner";

/** Growl-style success feedback (top-right toast). */
export function notifySuccess(message: string) {
  toast.success(message);
}

/** Growl-style error feedback (top-right toast). */
export function notifyError(message: string) {
  toast.error(message);
}

/** Neutral informational toast. */
export function notifyInfo(message: string) {
  toast.info(message);
}
