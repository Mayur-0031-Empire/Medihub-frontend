import { DoctorAvatar } from "@/components/appointments/DoctorAvatar";
import { PageLoader } from "@/components/common/PageLoader";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ExistingSlotsList,
  newSlotTimeRow,
  SlotDayPicker,
  slotRowsFromGenerated,
  SlotTimesEditor,
  type SlotTimeRow,
} from "@/components/slots/SlotScheduleEditor";
import {
  createAppointmentSlotsForDoctor,
  fetchDoctorSlots,
  fetchPublicDoctors,
  isServerConfigured,
} from "@/lib/api";
import { SERVICE_UNAVAILABLE, userFacingError } from "@/lib/userMessages";
import { doctorDisplayName } from "@/lib/appointments";
import { notifyError, notifySuccess } from "@/lib/notify";
import { buildSlotRange, todayDayKey } from "@/lib/slotSchedule";
import type { AppointmentSlot, PublicDoctorProfile } from "@/types/appointment";
import { CalendarPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function AdminManageSlotsPage() {
  const serverOk = isServerConfigured();
  const [doctors, setDoctors] = useState<PublicDoctorProfile[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorId, setDoctorId] = useState("");
  const [dayKey, setDayKey] = useState(todayDayKey());
  const [rows, setRows] = useState<SlotTimeRow[]>([newSlotTimeRow("09:00"), newSlotTimeRow("10:00"), newSlotTimeRow("11:00")]);
  const [existingSlots, setExistingSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d._id === doctorId) ?? null,
    [doctors, doctorId],
  );

  useEffect(() => {
    if (!serverOk) return;
    let cancelled = false;
    (async () => {
      setDoctorsLoading(true);
      try {
        const list = await fetchPublicDoctors();
        if (!cancelled) {
          setDoctors(list);
          if (list.length > 0) setDoctorId((prev) => prev || list[0]._id);
        }
      } catch (e) {
        if (!cancelled) notifyError(userFacingError(e, "Could not load doctors."));
      } finally {
        if (!cancelled) setDoctorsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverOk]);

  const loadExistingSlots = useCallback(async () => {
    if (!doctorId || !dayKey) return;
    setSlotsLoading(true);
    try {
      const from = new Date(`${dayKey}T00:00:00`);
      const to = new Date(`${dayKey}T23:59:59`);
      setExistingSlots(await fetchDoctorSlots(doctorId, from, to));
    } catch {
      setExistingSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, dayKey]);

  useEffect(() => {
    void loadExistingSlots();
  }, [loadExistingSlots]);

  async function onCreateSlots() {
    if (!doctorId) {
      notifyError("Select a verified doctor first.");
      return;
    }
    setSubmitting(true);
    try {
      const slots = rows.map((r) => buildSlotRange(dayKey, r.startTime, r.durationMinutes));
      await createAppointmentSlotsForDoctor(doctorId, slots);
      notifySuccess(`Added ${slots.length} slot(s) for ${dayKey}. Patients can book these times.`);
      void loadExistingSlots();
    } catch (e) {
      notifyError(
        userFacingError(
          e,
          "Could not create slots. Ensure the doctor is verified, or sign in as that doctor to add times from the doctor portal.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!serverOk) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">Manage doctor slots</h1>
        <p className="mt-2 text-sm">{SERVICE_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/dashboard/admin" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to admin home
      </Link>

      <div className="mt-4 flex items-start gap-3">
        <CalendarPlus className="h-8 w-8 shrink-0 text-violet-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Manage doctor slots</h1>
          <p className="mt-1 text-slate-600">
            Add open times for a verified doctor. You can also sign in as that doctor and use Doctor portal → Manage
            slots.
          </p>
        </div>
      </div>

      {doctorsLoading ? (
        <PageLoader label="Loading doctors…" className="mt-12" />
      ) : doctors.length === 0 ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          No verified doctors yet. Verify doctors under Pending doctors before adding slots.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-slot-doctor">Verified doctor</Label>
                <select
                  id="admin-slot-doctor"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {doctorDisplayName(d)} — {d.specialization}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDoctor ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <DoctorAvatar doctor={selectedDoctor} size="sm" />
                  <div>
                    <p className="font-medium text-slate-900">{doctorDisplayName(selectedDoctor)}</p>
                    <p className="text-sm text-slate-600">{selectedDoctor.hospitalName}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

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
            publishLabel={`Publish ${rows.length} slot${rows.length === 1 ? "" : "s"} for this day`}
            publishClassName="bg-violet-600 hover:bg-violet-700"
          />
          <ExistingSlotsList dayKey={dayKey} slotsLoading={slotsLoading} existingSlots={existingSlots} />
        </div>
      )}
    </div>
  );
}
