import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSlotRange } from "@/lib/appointments";
import { generateDaySlots } from "@/lib/slotSchedule";
import type { AppointmentSlot } from "@/types/appointment";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

export interface SlotTimeRow {
  id: string;
  startTime: string;
  durationMinutes: number;
}

export function newSlotTimeRow(startTime = "09:00"): SlotTimeRow {
  return { id: crypto.randomUUID(), startTime, durationMinutes: 30 };
}

export function slotRowsFromGenerated(dayKey: string, from: string, to: string): SlotTimeRow[] {
  return generateDaySlots(dayKey, from, to, 30).map((s) => {
    const d = new Date(s.startAt);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return { id: crypto.randomUUID(), startTime: `${hh}:${mm}`, durationMinutes: 30 };
  });
}

export function SlotDayPicker({
  dayKey,
  onDayKeyChange,
  children,
}: {
  dayKey: string;
  onDayKeyChange: (dayKey: string) => void;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {children}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slot-day">Day</Label>
          <Input
            id="slot-day"
            type="date"
            value={dayKey}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onDayKeyChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function SlotTimesEditor({
  rows,
  setRows,
  fillMorningAfternoon,
  submitting,
  onCreateSlots,
  publishLabel,
  publishClassName,
}: {
  rows: SlotTimeRow[];
  setRows: Dispatch<SetStateAction<SlotTimeRow[]>>;
  fillMorningAfternoon: () => void;
  submitting: boolean;
  onCreateSlots: () => void;
  publishLabel?: string;
  publishClassName?: string;
}) {
  const label = publishLabel ?? `Publish ${rows.length} slot${rows.length === 1 ? "" : "s"}`;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm">Times to add</CardTitle>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={fillMorningAfternoon}>
            9–12 & 2–5 (30 min)
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setRows((prev) => [...prev, newSlotTimeRow()])}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add time
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[7rem] flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Start</Label>
                <Input
                  type="time"
                  value={row.startTime}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, startTime: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs text-muted-foreground">Minutes</Label>
                <Input
                  type="number"
                  min={15}
                  max={120}
                  step={15}
                  value={row.durationMinutes}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, durationMinutes: Number(e.target.value) || 30 } : r,
                      ),
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                aria-label="Remove time"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          disabled={submitting || rows.length === 0}
          className={publishClassName}
          onClick={onCreateSlots}
        >
          {submitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {label}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ExistingSlotsList({
  dayKey,
  slotsLoading,
  existingSlots,
}: {
  dayKey: string;
  slotsLoading: boolean;
  existingSlots: AppointmentSlot[];
}) {
  return (
    <Card className="bg-slate-50/80">
      <CardHeader>
        <CardTitle className="text-sm">Open slots on this day</CardTitle>
      </CardHeader>
      <CardContent>
        {slotsLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : existingSlots.length === 0 ? (
          <p className="text-sm text-slate-600">No available slots on {dayKey} yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {existingSlots.map((s) => (
              <li
                key={s._id}
                className="rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-medium text-teal-900"
              >
                {formatSlotRange(s.startAt, s.endAt)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
