import { Badge } from "@/components/ui/badge";
import { appointmentStatusBadgeClass } from "@/lib/appointments/status";
import { formatAppointmentStatus } from "@/lib/appointments";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        appointmentStatusBadgeClass(status),
        className,
      )}
    >
      {formatAppointmentStatus(status)}
    </Badge>
  );
}
