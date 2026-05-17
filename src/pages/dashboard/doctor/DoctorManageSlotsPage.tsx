import { DoctorAvatar } from "@/components/appointments/DoctorAvatar";
import { PageLoader } from "@/components/common/PageLoader";
import {
  ExistingSlotsList,
  newSlotTimeRow,
  SlotDayPicker,
  slotRowsFromGenerated,
  SlotTimesEditor,
  type SlotTimeRow,
} from "@/components/slots/SlotScheduleEditor";
import { createAppointmentSlots, fetchDoctorMe, fetchDoctorSlots, isServerConfigured, userFacingError } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";
import { doctorDisplayName, filterNewSlotInputs } from "@/lib/appointments";
import { notifyError, notifySuccess } from "@/lib/notify";
import { buildSlotRange, todayDayKey } from "@/lib/slotSchedule";
import type { AppointmentSlot, PublicDoctorProfile } from "@/types/appointment";
import { CalendarPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function DoctorManageSlotsPage() {
  const serverOk = isServerConfigured();
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [doctorPreview, setDoctorPreview] = useState<PublicDoctorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dayKey, setDayKey] = useState(todayDayKey());
  const [rows, setRows] = useState<SlotTimeRow[]>([newSlotTimeRow("09:00"), newSlotTimeRow("10:00"), newSlotTimeRow("11:00")]);
  const [existingSlots, setExistingSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!serverOk) return;
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const raw = await fetchDoctorMe();
        if (cancelled) return;
        if (!raw || typeof raw !== "object") {
          setDoctorProfileId(null);
          setDoctorPreview(null);
          return;
        }
        const o = raw as Record<string, unknown>;
        const id = String(o._id ?? o.id ?? "");
        if (!id) {
          setDoctorProfileId(null);
          return;
        }
        setDoctorProfileId(id);
        const user =
          o.user && typeof o.user === "object" ? (o.user as PublicDoctorProfile["user"]) : undefined;
        setDoctorPreview({
          _id: id,
          specialization: String(o.specialization ?? "—"),
          experienceYears: Number(o.experienceYears) || 0,
          hospitalName: String(o.hospitalName ?? "—"),
          consultationFee: Number(o.consultationFee) || 0,
          availabilitySchedule: String(o.availabilitySchedule ?? ""),
          user,
        });
      } catch (e) {
        if (!cancelled) notifyError(userFacingError(e, "Could not load your doctor profile."));
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverOk]);

  const loadExistingSlots = useCallback(async () => {
    if (!doctorProfileId || !dayKey) return;
    setSlotsLoading(true);
    try {
      const from = new Date(`${dayKey}T00:00:00`);
      const to = new Date(`${dayKey}T23:59:59`);
      setExistingSlots(await fetchDoctorSlots(doctorProfileId, from, to));
    } catch {
      setExistingSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorProfileId, dayKey]);

  useEffect(() => {
    void loadExistingSlots();
  }, [loadExistingSlots]);

  async function onCreateSlots() {
    if (!doctorProfileId) {
      notifyError("Complete your doctor professional profile before adding slots.");
      return;
    }
    setSubmitting(true);
    try {
      const slots = rows.map((r) => buildSlotRange(dayKey, r.startTime, r.durationMinutes));
      const newSlots = filterNewSlotInputs(slots, existingSlots);
      if (newSlots.length === 0) {
        notifyError(
          "All selected times already exist for this day (see open slots below). Change times or remove duplicates in your list.",
        );
        return;
      }
      const result = await createAppointmentSlots(newSlots);
      const skipped = slots.length - newSlots.length + result.skipped;
      let msg = `Published ${result.created} new slot(s) for ${dayKey}.`;
      if (skipped > 0) {
        msg += ` ${skipped} duplicate time(s) were skipped.`;
      }
      notifySuccess(msg);
      void loadExistingSlots();
    } catch (e) {
      notifyError(userFacingError(e, "Could not create slots."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">Manage slots</h1>
        <p className="mt-2 text-sm">{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/dashboard/doctor" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to doctor home
      </Link>
      <div className="mt-4 flex items-start gap-3">
        <CalendarPlus className="h-8 w-8 shrink-0 text-teal-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Manage your slots</h1>
          <p className="mt-1 text-slate-600">Add open times so patients can book with your verified doctor account.</p>
        </div>
      </div>

      {profileLoading ? (
        <PageLoader label="Loading profile…" className="mt-12" />
      ) : !doctorProfileId ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Complete your{" "}
          <Link to="/dashboard/doctor-profile" className="font-semibold text-teal-800 underline">
            professional profile
          </Link>{" "}
          first, then return here to publish availability.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {doctorPreview ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <DoctorAvatar doctor={doctorPreview} size="md" />
              <div>
                <p className="font-semibold text-slate-900">{doctorDisplayName(doctorPreview)}</p>
                <p className="text-sm text-teal-700">{doctorPreview.specialization}</p>
              </div>
            </div>
          ) : null}
          <SlotDayPicker dayKey={dayKey} onDayKeyChange={setDayKey} />
          <SlotTimesEditor
            rows={rows}
            setRows={setRows}
            fillMorningAfternoon={() =>
              setRows([
                ...slotRowsFromGenerated(dayKey, "09:00", "12:00"),
                ...slotRowsFromGenerated(dayKey, "14:00", "17:00"),
              ])
            }
            submitting={submitting}
            onCreateSlots={() => void onCreateSlots()}
          />
          <ExistingSlotsList dayKey={dayKey} slotsLoading={slotsLoading} existingSlots={existingSlots} />
        </div>
      )}
    </div>
  );
}
