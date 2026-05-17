import { DoctorAvatar } from "@/components/appointments/DoctorAvatar";
import { PageLoader } from "@/components/common/PageLoader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { bookAppointment, fetchDoctorSlots, userFacingError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  EMERGENCY_NOTES_PREFIX,
  pickEarliestFutureSlot,
  doctorDisplayName,
  formatConsultationFee,
  formatSlotRange,
  isSlotBookable,
  isSlotUnavailableMessage,
  slotDayKey,
  slotDayLabel,
} from "@/lib/appointments";
import type { AppointmentSlot, PublicDoctorProfile } from "@/types/appointment";
import { AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

function BookAppointmentBody({
  doctor,
  emergency,
  onClose,
  onBooked,
}: {
  doctor: PublicDoctorProfile;
  emergency?: boolean;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [trainingConsent, setTrainingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);

  const slotQueryRange = useCallback(() => {
    const from = new Date();
    if (!emergency) from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + (emergency ? 2 : 14));
    return { from, to };
  }, [emergency]);

  const applySlots = useCallback(
    (rows: AppointmentSlot[], preferSlotId?: string) => {
      setSlots(rows);
      const days = [...new Set(rows.map((s) => slotDayKey(s.startAt)))].sort();
      const firstDay = days[0] ?? "";
      setSelectedDay(firstDay);

      const current =
        preferSlotId && rows.find((s) => s._id === preferSlotId && isSlotBookable(s));
      if (current) {
        setSelectedSlotId(current._id);
        setSelectedDay(slotDayKey(current.startAt));
        return;
      }

      if (emergency) {
        const earliestId = pickEarliestFutureSlot(rows);
        if (earliestId) {
          setSelectedSlotId(earliestId);
          const slot = rows.find((s) => s._id === earliestId);
          if (slot) setSelectedDay(slotDayKey(slot.startAt));
        } else {
          setSelectedSlotId("");
        }
      } else {
        setSelectedSlotId("");
      }
    },
    [emergency],
  );

  const reloadSlots = useCallback(async (): Promise<AppointmentSlot[]> => {
    const { from, to } = slotQueryRange();
    return fetchDoctorSlots(doctor._id, from, to);
  }, [doctor._id, slotQueryRange]);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlotId("");
    void (async () => {
      try {
        const rows = await reloadSlots();
        if (!cancelled) applySlots(rows);
      } catch (e) {
        if (!cancelled) {
          const msg = userFacingError(e, "Could not load available times.");
          setSlotsError(msg);
          notifyError(msg);
          setSlots([]);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctor._id, emergency, reloadSlots, applySlots]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, AppointmentSlot[]>();
    for (const s of slots) {
      const key = slotDayKey(s.startAt);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [slots]);

  const dayKeys = useMemo(() => [...slotsByDay.keys()].sort(), [slotsByDay]);
  const slotsForDay = selectedDay ? (slotsByDay.get(selectedDay) ?? []) : [];
  const name = doctorDisplayName(doctor);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlotId) {
      notifyError("Choose a time slot to continue.");
      return;
    }
    if (emergency && !symptoms.trim()) {
      notifyError("Describe your urgent symptoms so the doctor can prepare.");
      return;
    }
    const picked = slots.find((s) => s._id === selectedSlotId);
    if (!picked || !isSlotBookable(picked)) {
      notifyError("That time has passed. Choose another slot or refresh the list.");
      try {
        const rows = await reloadSlots();
        applySlots(rows, selectedSlotId);
      } catch {
        /* keep existing list */
      }
      return;
    }

    setSubmitting(true);
    try {
      const fresh = await reloadSlots();
      if (!fresh.some((s) => s._id === selectedSlotId)) {
        applySlots(fresh, selectedSlotId);
        notifyError("That slot was just booked by someone else. Please pick another time.");
        return;
      }

      const notesBody = patientNotes.trim();
      const mergedNotes = emergency
        ? [EMERGENCY_NOTES_PREFIX, notesBody].filter(Boolean).join(" ")
        : notesBody || undefined;
      await bookAppointment({
        slotId: selectedSlotId,
        symptoms: symptoms.trim() || undefined,
        patientNotes: mergedNotes,
        trainingConsent: trainingConsent || undefined,
        isEmergency: emergency || undefined,
      });
      notifySuccess(emergency ? "Urgent visit requested." : "Appointment booked successfully.");
      setBookSuccess(true);
      onBooked();
    } catch (err) {
      const msg = userFacingError(err, "Booking failed.");
      if (isSlotUnavailableMessage(msg)) {
        try {
          const rows = await reloadSlots();
          applySlots(rows, selectedSlotId);
          notifyError(
            "That slot is no longer available — it may have been booked already. Please choose another time.",
          );
        } catch {
          notifyError(msg);
        }
      } else {
        notifyError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const header = (
    <>
      <DoctorAvatar doctor={doctor} size="md" />
      <div className="min-w-0">
        <p className="text-lg font-semibold text-slate-900">
          {emergency ? "Urgent visit with" : "Book with"} {name}
        </p>
        <p className="text-sm text-teal-700">{doctor.specialization}</p>
        <p className="text-xs text-slate-500">
          {doctor.hospitalName} · {formatConsultationFee(doctor.consultationFee)}
        </p>
      </div>
    </>
  );

  if (bookSuccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Calendar className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-lg font-semibold text-slate-900">Appointment booked</p>
        <p className="text-sm text-slate-600">Your visit is confirmed. You can review it under My appointments.</p>
        <Button type="button" className="mt-2 rounded-xl" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">{header}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {emergency ? (
          <p className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            For life-threatening emergencies, call your local emergency number first. This books the soonest available
            slot with a doctor on MediHub.
          </p>
        ) : null}
        <p className="text-sm font-medium text-slate-800">{emergency ? "Soonest available time" : "Choose a time"}</p>
        {slotsLoading ? (
          <PageLoader label="Loading available times…" className="py-8" />
        ) : slotsError || dayKeys.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            {emergency
              ? "No urgent slots in the next 48 hours. Try another doctor or call emergency services."
              : "No open slots in the next two weeks. Try another doctor or check back later."}
          </p>
        ) : (
          <>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {dayKeys.map((day) => (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={selectedDay === day ? "default" : "outline"}
                  className="shrink-0 rounded-xl"
                  onClick={() => {
                    setSelectedDay(day);
                    const daySlots = slotsByDay.get(day) ?? [];
                    const stillValid = daySlots.some((s) => s._id === selectedSlotId);
                    if (!stillValid) setSelectedSlotId("");
                  }}
                >
                  {slotDayLabel(day)}
                </Button>
              ))}
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {slotsForDay.map((slot) => {
                const active = selectedSlotId === slot._id;
                return (
                  <li key={slot._id}>
                    <Button
                      type="button"
                      variant={active ? "secondary" : "outline"}
                      className="h-auto w-full justify-start rounded-xl px-3 py-2.5 text-left text-sm"
                      onClick={() => setSelectedSlotId(slot._id)}
                    >
                      {formatSlotRange(slot.startAt, slot.endAt)}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="mt-6 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-800">
              {emergency ? "Urgent symptoms" : "Symptoms (optional)"}
            </span>
            <Textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={
                emergency
                  ? "What happened and how severe are your symptoms?"
                  : "Briefly describe what you need help with"
              }
              required={emergency}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-800">Notes for the doctor (optional)</span>
            <Textarea
              rows={2}
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="Allergies, medications, or other context"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={trainingConsent}
              onChange={(e) => setTrainingConsent(e.target.checked)}
            />
            <span className="text-xs leading-relaxed text-slate-600">
              I agree that anonymized visit data may be used to improve care tools (optional).
            </span>
          </label>
        </div>

      </div>

      <div className="shrink-0 border-t border-slate-100 p-4 sm:px-5">
        <Button
          type="submit"
          disabled={submitting || slotsLoading || dayKeys.length === 0}
          variant={emergency ? "destructive" : "default"}
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-md"
        >
          {submitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {emergency ? "Request urgent visit" : "Confirm booking"}
        </Button>
      </div>
    </form>
  );
}

function BookingShell({
  open,
  onClose,
  title,
  description,
  children,
  mobile,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  mobile: boolean;
}) {
  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="flex max-h-[min(92dvh,720px)] flex-col gap-0 rounded-t-3xl p-0 sm:max-w-lg"
          showCloseButton
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[min(92dvh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function BookAppointmentPanel({
  doctor,
  emergency = false,
  onClose,
  onBooked,
}: {
  doctor: PublicDoctorProfile;
  emergency?: boolean;
  onClose: () => void;
  onBooked: () => void;
}) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const name = doctorDisplayName(doctor);
  const title = emergency ? `Urgent visit with ${name}` : `Book with ${name}`;

  return (
    <BookingShell
      open
      onClose={onClose}
      title={title}
      description={`Book an appointment with ${name}`}
      mobile={isMobile}
    >
      <BookAppointmentBody doctor={doctor} emergency={emergency} onClose={onClose} onBooked={onBooked} />
    </BookingShell>
  );
}
