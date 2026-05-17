# Frontend features vs README API contract

This document lists **MediHub frontend capabilities** that are implemented in this repo but are **missing, incomplete, or only partially described** in [README.md](./README.md) (the backend API contract).

Use it when implementing or extending the **MediHub server** so the backend matches what the UI already expects.

**Last aligned with frontend:** doctor video consult, restore cancelled visits, AI imaging review, live transcription.

---

## Summary

| Area | Frontend status | README / API status |
|------|-----------------|---------------------|
| Restore cancelled appointment (doctor) | Implemented | **Not documented** — dedicated endpoint assumed |
| AI MRI/X-ray analysis (doctor consult) | Implemented | **No appointment imaging API** — uses AI Chat `attachments` |
| Live meeting transcript | Implemented | Field exists on doctor-notes; **no STT API** (browser-only) |
| Live consult sync (poll) | Implemented | Uses existing `GET` appointment — no WebSocket |
| Vitals from patient PDF (doctor) | Implemented | Client-side PDF parse — **no OCR API** |
| Medical scan viewer | Implemented | **No API** — loads report URLs from appointment |
| Emergency booking flag | Implemented | **`isEmergency` on book** not in README snippet |
| Patient medical library | Implemented | Aggregates `GET` appointment + detail — no archive API |

---

## 1. Restore cancelled appointment (doctor)

### What the UI does

Doctors can **restore** a visit they previously cancelled so it appears active again.

**Where:**

- `/dashboard/doctor-profile` — section **Cancelled visits**
- `/dashboard/doctor/appointments` — **Cancelled visits** list
- `/dashboard/doctor/appointments/:appointmentId` — **Restore appointment** when status is cancelled

**Code:**

- `src/lib/api/appointments.ts` → `restoreAppointmentByDoctor()`
- `src/lib/config.ts` → `appointmentRestoreByDoctorPath()`
- `src/components/doctor/DoctorCancelledAppointmentsSection.tsx`

### API the frontend calls

**Primary (not in README):**

```http
PATCH /api/appointments/:appointmentId/restore-by-doctor
Content-Type: application/json
Body: {}
Auth: doctor (session cookie / Bearer per your auth setup)
```

**Override path (optional env):**

```bash
VITE_APPOINTMENT_RESTORE_BY_DOCTOR_PATH=/api/appointments/:appointmentId/restore-by-doctor
```

**Fallback if primary returns `404`, `405`, or `501`:**

```http
PATCH /api/appointments/:appointmentId/doctor-notes
Content-Type: application/json
Body: { "status": "scheduled" }
```

(`status` on doctor-notes **is** documented in README; using it to uncancel is **not** documented.)

### Suggested backend contract

```json
// Response: same shape as GET /api/appointments/:appointmentId
{
  "ok": true,
  "data": {
    "appointment": {
      "_id": "...",
      "status": "scheduled",
      "cancelReason": null
    }
  }
}
```

**Behavior expectations:**

- Only the **doctor** who owns the visit (or admin) can restore.
- Slot must still be valid (or backend re-reserves slot).
- Patient should receive a notification (optional but consistent with cancel-by-doctor).

**README today:** only `PATCH .../cancel-by-doctor` — **no restore endpoint**.

---

## 2. AI imaging analysis (MRI / X-ray) during live consult

### What the UI does

During a **live doctor video consult**, when the patient uploads images (PNG/JPEG/WebP), the doctor can open **View + AI** and run **AI analyze**. The image is sent to the **AI Chat** API with a radiology-style prompt (decision support, not diagnosis).

**Where:**

- `/dashboard/doctor/consult/:appointmentId` — **Patient uploads** → **View + AI** (only when call is **Live**)
- `src/components/doctor/MedicalScanViewer.tsx`
- `src/lib/consult/imagingAi.ts` → `analyzeMedicalScanWithAi()`

### API the frontend calls

**No dedicated appointment imaging endpoint.**

Uses documented AI Chat with attachments:

```http
POST /api/ai/chats/messages
Content-Type: multipart/form-data

message: <structured prompt with symptoms/diagnosis context>
attachments: <image file>
```

**Code:** `src/lib/api/ai-chat.ts` → `sendAiChatMessageWithAttachments()`

### Backend requirements

- AI Chat must accept **image attachments** and run a **vision-capable** model.
- Response must include assistant text in the usual chat thread shape (or `reply` / `content` at top level — frontend normalizes both).

### Not supported in UI

| Format | UI behavior |
|--------|-------------|
| DICOM (`.dcm`) | Message to use PACS or export PNG/JPEG |
| PDF as “scan” | Use **Extract vitals** (lab PDF path), not AI vision |

**README today:** AI Chat `attachments` documented; **no** `POST .../appointments/:id/analyze-imaging`.

---

## 3. Live consultation transcript (doctor)

### What the UI does

While the video call is **connected**, the doctor’s browser **continuously transcribes microphone audio** (Web Speech API), appends timestamped lines, auto-saves `meetingTranscript` to the server, and includes it when generating AI prescription drafts.

**Where:**

- `/dashboard/doctor/consult/:appointmentId` — right panel **Live transcript**
- `src/hooks/useConsultationTranscription.ts`

### API the frontend calls

```http
PATCH /api/appointments/:appointmentId/doctor-notes
Body: { "meetingTranscript": "..." }
```

Also used before:

```http
POST /api/appointments/:appointmentId/ai-draft
```

(README documents both; **speech-to-text is not a server API** — Chrome/Edge only.)

### Gaps

| Item | Notes |
|------|--------|
| Server-side STT | **Not implemented** — no upload of audio stream |
| Patient audio | Only captured if audible on doctor’s mic/speakers |
| Transcript during ai-draft | Server should read saved `meetingTranscript` from DB when generating draft |

---

## 4. Live consult real-time sync (polling)

### What the UI does

During video consult, appointment data is **refetched every ~8 seconds** so:

- Patient uploads appear on the doctor side
- Patient sees updated prescription after doctor approves

**Code:** `src/hooks/useConsultAppointmentPoll.ts`

### API used

```http
GET /api/appointments/:appointmentId
```

**README:** documented. **No gap** — pattern is frontend-only (polling vs push).

**Doctor poll runs only when** `callConnected === true`. **Patient poll** runs while on consult page.

---

## 5. Vitals extraction from patient reports (doctor)

### What the UI does

On live consult (and appointment detail), doctor can **Extract vitals** from patient-uploaded **PDF or text** lab reports. Parsing runs **in the browser** (pdf.js + regex/heuristics in `src/lib/appointments/vitals.ts`).

### API used

```http
GET <report file URL from appointment.patientReports[].url>
```

Then local parse — **no** `POST .../extract-vitals`.

**README:** patient reports upload documented; **no** vitals extraction endpoint.

---

## 6. Doctor live consult workflow panel

### What the UI does

Single page combining:

| Feature | Persists via |
|---------|----------------|
| Live transcript | `meetingTranscript` on doctor-notes |
| Patient uploads list | `GET` appointment (poll) |
| Vitals intake + document import | `doctorNotes` (vitals embedded in notes) |
| Diagnosis / clinical notes | doctor-notes |
| AI prescription + approve | ai-draft + prescription/approve |

**Route:** `/dashboard/doctor/consult/:appointmentId`

**Not in README as one “consult session” API** — composition of existing endpoints.

---

## 7. Patient video consult sidebar

### What the UI does

| Feature | API |
|---------|-----|
| View prescription (poll for updates) | `GET /api/appointments/:appointmentId` |
| Upload MRI / X-ray / PDF | `POST /api/appointments/:appointmentId/reports` |

**Route:** `/dashboard/patient/consult/:appointmentId`

All endpoints are in README; **UX/layout is frontend-only**.

---

## 8. Patient medical library

### What the UI does

Lists all patient appointments with prescriptions and uploaded files grouped by visit.

**Route:** `/dashboard/patient/medical-records`

**API:** `GET /api/appointments/me` + `GET /api/appointments/:id` per row (`src/lib/appointments/medicalArchive.ts`).

**README:** no dedicated “medical archive” endpoint — **N+1 detail fetches** from frontend.

---

## 9. Emergency booking (possible API gap)

### What the UI sends

`BookAppointmentPanel` may include:

```json
{
  "slotId": "...",
  "symptoms": "...",
  "patientNotes": "...",
  "isEmergency": true
}
```

**Route:** `/emergency` → `src/pages/public/EmergencyAppointmentPage.tsx`

**README book body** lists `symptoms`, `patientNotes`, `trainingConsent` — **`isEmergency` is not listed**. Confirm backend accepts or ignore.

---

## 10. Client-only / infrastructure (no new REST API)

| Feature | Implementation |
|---------|----------------|
| WebRTC video | Socket.IO signaling (README WebRTC section) + `src/hooks/useVideoConsultation.ts` |
| Scan viewer (zoom, contrast, invert) | `MedicalScanViewer.tsx` — browser only |
| Scan “pass” animation | CSS — no AI |
| Auth refresh on 401 | README mentions refresh; frontend may not call it yet (see README auth note) |

---

## Environment variables (frontend-only overrides)

| Variable | Purpose |
|----------|---------|
| `VITE_MEDIHUB_SERVER` | Backend origin |
| `VITE_MEDIHUB_SAME_ORIGIN` | Use Vite proxy for `/api` |
| `VITE_APPOINTMENT_RESTORE_BY_DOCTOR_PATH` | Override restore URL |
| `VITE_APPOINTMENT_BY_ID_PATH` | Override appointment detail path template |

See `src/lib/config.ts` and `.env.example` for full list.

---

## Recommended README additions (for backend team)

1. **`PATCH /api/appointments/:appointmentId/restore-by-doctor`** — mirror cancel-by-doctor.
2. **AI imaging** — either document “use AI Chat attachments for consult imaging” or add **`POST /api/appointments/:appointmentId/analyze-imaging`**.
3. **`meetingTranscript`** — note that ai-draft should consume saved transcript.
4. **`isEmergency`** on `POST /api/appointments/book` if supported.
5. Optional: **`GET /api/appointments/me/archive`** to avoid N+1 for medical library.

---

## File index (frontend)

| Topic | Primary files |
|-------|----------------|
| Restore | `src/lib/api/appointments.ts`, `src/components/doctor/DoctorCancelledAppointmentsSection.tsx` |
| AI imaging | `src/lib/consult/imagingAi.ts`, `src/components/doctor/MedicalScanViewer.tsx` |
| Live transcript | `src/hooks/useConsultationTranscription.ts`, `src/components/doctor/DoctorConsultClinicalPanel.tsx` |
| Doctor consult page | `src/pages/dashboard/doctor/DoctorConsultPage.tsx` |
| Patient consult | `src/pages/dashboard/patient/PatientConsultPage.tsx` |
| API client split | `src/lib/api/*` |
| Paths | `src/lib/config.ts` |

---

## Related docs

- [README.md](./README.md) — official API contract
- [.env.example](./.env.example) — frontend env vars (if present)
