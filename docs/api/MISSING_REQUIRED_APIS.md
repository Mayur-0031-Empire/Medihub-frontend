# Missing required APIs

APIs and backend behaviors **not fully available today** but required (or strongly recommended) for the MediHub frontend in this repo.

**Official contract:** [README.md](../../README.md) (backend API reference).

**Companion doc:** [IMPLEMENTED_FEATURES_API_GAPS.md](../../IMPLEMENTED_FEATURES_API_GAPS.md) (feature narratives).

**Last reviewed:** 2026-05-17 — patient notifications, doctor file delete, patient visibility of `doctorFiles`, visit documents, SMS booking (planned).

---

## How to read this document

| Column / section | Meaning |
|------------------|---------|
| **Priority** | Implementation urgency for backend |
| **Status** | `Missing` = not in README / not implemented; `Partial` = exists but contract incomplete; `Workaround` = frontend degrades gracefully |
| **Frontend** | Files and routes that call or depend on the API |
| **Suggested contract** | Request/response the UI expects |

### Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | UI calls this today; feature **fails** or is **broken** without it |
| **P1** | Core product ask; workaround exists but UX is poor or unreliable |
| **P2** | Performance, audit, or polish; dedicated API optional |
| **P3** | Secondary / admin / optional integration |

---

## Summary table (all gaps)

| Priority | Status | Method | Path | Feature |
|----------|--------|--------|------|---------|
| **P0** | Missing | `PATCH` | `/api/appointments/:appointmentId/restore-by-doctor` | Doctor restore cancelled visit |
| **P0** | Missing | `DELETE` | `/api/appointments/:appointmentId/doctor-files/:fileId` | Doctor delete shared file |
| **P0** | Partial | `DELETE` | `/api/appointments/:appointmentId/doctor-files` | Doctor delete file (body fallback) |
| **P0** | Partial | `GET` | `/api/appointments/:appointmentId` | Include `doctorFiles[]` for **patient** role |
| **P1** | Partial | `GET` | `/api/appointments/notifications` | **Patient** notifications (visits, Rx, files) |
| **P1** | Missing | `PATCH` | `/api/appointments/notifications/:id/read` | Persist patient notification read state |
| **P1** | Missing | `POST` | `/api/appointments/:appointmentId/notifications` | Server push on Rx / files / cancel (optional) |
| **P1** | Missing | `POST` | `/api/appointments/book` → SMS | Booking confirmation SMS + video link |
| **P1** | Missing | `POST` | `/api/appointments/:appointmentId/send-confirmation-sms` | Resend consult link SMS |
| **P1** | Partial | `POST` | `/api/appointments/book` | Accept `isEmergency` |
| **P1** | Partial | `POST` | `/api/appointments/:appointmentId/ai-draft` | Use persisted `meetingTranscript` |
| **P1** | Partial | `POST` | `/api/ai/chats/messages` | Vision **attachments** (consult imaging) |
| **P2** | Workaround | `GET` | `/api/appointments/me/archive` | Patient medical library (N+1 today) |
| **P2** | Workaround | `POST` | `/api/appointments/:appointmentId/analyze-imaging` | Dedicated imaging analysis |
| **P2** | Workaround | `POST` | `/api/appointments/:appointmentId/extract-vitals` | Server OCR/PDF vitals |
| **P2** | Workaround | `POST` | `/api/appointments/:appointmentId/transcribe` | Server-side STT |
| **P2** | Partial | `GET` | `/api/hospital-locator/*` | Map config, photos (nearby wired) |

---

## Feature map → APIs

| Product feature | Patient | Doctor | Admin | Primary APIs |
|-----------------|---------|--------|-------|----------------|
| Book appointment | ✓ | — | — | `POST .../book` |
| Video consult | ✓ | ✓ | — | Socket.IO + `GET .../:id` |
| Upload patient reports | ✓ | view | — | `POST .../reports` |
| Upload doctor files | view | ✓ | — | `POST .../doctor-files` |
| **Delete doctor files** | — | ✓ | — | **`DELETE .../doctor-files`** |
| View prescription | ✓ | ✓ | — | `GET .../:id`, `PATCH .../prescription/approve` |
| **Patient notifications** | ✓ | — | — | **`GET .../notifications`** |
| Doctor notifications | — | ✓ | — | `GET .../notifications` |
| Visit documents page | ✓ | — | — | `GET .../:id` (`doctorFiles`, Rx) |
| Medical library | ✓ | — | — | `GET .../me` + N× `GET .../:id` |
| **SMS booking confirm** | ✓ | — | — | **New SMS endpoint(s)** |
| Restore cancelled visit | — | ✓ | ✓? | `PATCH .../restore-by-doctor` |
| Emergency booking | ✓ | — | — | `POST .../book` + `isEmergency` |
| AI prescription draft | — | ✓ | — | `POST .../ai-draft`, `PATCH .../doctor-notes` |
| AI scan review | — | ✓ | — | `POST .../ai/chats/messages` (vision) |
| Hospital locator | ✓ | — | ✓ | `GET .../hospital-locator/nearby` |

---

# P0 — Required now

## 1. Restore cancelled appointment (doctor)

| Field | Value |
|-------|--------|
| **Priority** | P0 |
| **Status** | Missing (README documents cancel only) |
| **User story** | Doctor re-activates a visit they cancelled so it returns to the schedule. |

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/appointments/:appointmentId/restore-by-doctor` |
| **Auth** | Doctor (owner of visit) or admin |
| **Body** | `{}` |
| **Response** | Same envelope as `GET /api/appointments/:appointmentId` |

**Frontend**

| Item | Location |
|------|----------|
| API | `src/lib/api/appointments.ts` → `restoreAppointmentByDoctor()` |
| Path | `src/lib/config.ts` → `appointmentRestoreByDoctorPath()` |
| Env | `VITE_APPOINTMENT_RESTORE_BY_DOCTOR_PATH` |
| UI | `DoctorCancelledAppointmentsSection.tsx`, doctor appointment detail, doctor profile |

**Fallback:** On `404` / `405` / `501`, client retries `PATCH .../doctor-notes` with `{ "status": "scheduled" }`.

**Backend behavior**

- Only assigning doctor (or admin) may restore.
- Clear `cancelReason`; set `status` to `scheduled` (or prior active state).
- Re-validate slot if needed.
- **Recommended:** create patient notification (`kind: appointment`) and optional SMS.

---

## 2. Delete doctor file (doctor portal)

| Field | Value |
|-------|--------|
| **Priority** | P0 |
| **Status** | Missing (README documents `POST .../doctor-files` upload only) |
| **User story** | Doctor removes a file they shared with the patient; patient must no longer see it on visit documents, consult sidebar, or notifications. |

The UI shows a **trash** control per file in **Share files with patient** (appointment detail + live consult).

| | |
|---|---|
| **Method** | `DELETE` (preferred) |
| **Path (primary)** | `/api/appointments/:appointmentId/doctor-files/:fileId` |
| **Path (fallback)** | `/api/appointments/:appointmentId/doctor-files` |
| **Auth** | Doctor assigned to visit |
| **Body (fallback only)** | JSON — one of: |

```json
{ "fileId": "<mongo-or-storage-id>" }
```

```json
{ "url": "/uploads/appointments/abc/report.pdf" }
```

```json
{ "index": 0 }
```

| **Response** | Updated appointment document (must include refreshed `doctorFiles[]`) |

**File reference shape** (include on upload and on `GET` appointment):

```json
{
  "doctorFiles": [
    {
      "_id": "64f1c2...",
      "title": "Referral letter.pdf",
      "url": "/uploads/appointments/.../referral.pdf",
      "name": "Referral letter.pdf"
    }
  ]
}
```

**Frontend**

| Item | Location |
|------|----------|
| API | `deleteDoctorAppointmentFile()` in `src/lib/api/appointments.ts` |
| Path | `appointmentDoctorFileDeletePath()` — env `VITE_APPOINTMENT_DOCTOR_FILE_DELETE_PATH` |
| UI | `DoctorFilesUploadSection.tsx`, `DoctorAppointmentFileList.tsx` |
| Routes | `/dashboard/doctor/appointments/:id`, `/dashboard/doctor/consult/:id` |

**Client attempt order**

1. `DELETE .../doctor-files/:fileId` when `file._id` is present.
2. `DELETE .../doctor-files` with JSON body (`fileId`, `url`, or `index`).

**Backend behavior**

- Remove file from storage and from appointment array.
- Idempotent delete (repeat → `404` or success).
- **Recommended:** patient notification `kind: doctor_files` is updated/removed; no stale links.

---

## 3. Patient access to `doctorFiles` on appointment detail

| Field | Value |
|-------|--------|
| **Priority** | P0 |
| **Status** | Partial — upload works for doctor; **patients often receive empty `doctorFiles`** on `GET` |
| **User story** | Patient sees **Files from your doctor** on visit detail, video consult, visit documents, and medical library. |

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/appointments/:appointmentId` |
| **Auth** | Patient (booking owner) or doctor on that visit |
| **Requirement** | Response **must** include `doctorFiles[]` for patients (same as doctor view). |

**Frontend**

| Item | Location |
|------|----------|
| Normalization | `collectDoctorFileRefs()` in `src/lib/appointments/normalize.ts` (many alternate field names) |
| Patient UI | `PatientDoctorFilesSection.tsx`, `PatientVisitDocumentsPage.tsx`, `ConsultPatientSidebar.tsx`, `PatientMedicalRecordsPage.tsx` |

**Alternate response keys accepted by frontend** (any may be used; prefer `doctorFiles`):

`doctorFiles`, `doctorDocuments`, `doctor_files`, `sharedFiles`, `sharedDocuments`, or nested under `data.appointment` + sibling `doctorFiles` on envelope.

**Backend behavior**

- Patient role must **not** strip `doctorFiles` on read.
- File URLs must be reachable by patient (signed URL or cookie-auth download route).
- After `DELETE` (§2), patient `GET` must reflect removal immediately.

---

# P1 — Core product (notifications, SMS, contracts)

## 4. Patient notifications API

| Field | Value |
|-------|--------|
| **Priority** | P1 |
| **Status** | Partial — `GET /api/appointments/notifications` exists in README; **patient-specific payload not defined** |
| **User story** | Patient sees a bell and **Notifications** page for visits, prescriptions, and doctor-shared files. |

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/appointments/notifications` |
| **Auth** | Logged-in user; server filters by **role** |
| **Query (optional)** | `?unreadOnly=true`, `?limit=40` |

**Suggested response**

```json
{
  "ok": true,
  "data": {
    "notifications": [
      {
        "_id": "notif-abc123",
        "message": "Dr. Patel shared 2 files for your visit.",
        "type": "doctor_files",
        "kind": "doctor_files",
        "appointmentId": "appt-xyz",
        "read": false,
        "createdAt": "2026-05-17T10:30:00.000Z"
      }
    ]
  }
}
```

**Notification `type` / `kind` values** (frontend maps these):

| kind | When to emit |
|------|----------------|
| `appointment` | Booking confirmed; upcoming visit reminder |
| `prescription` | Prescription approved (or draft ready, if you support drafts) |
| `doctor_files` | Doctor uploaded or removed files (optional: only on upload) |
| `cancellation` | Doctor cancelled visit |
| `general` | Fallback |

**Frontend**

| Item | Location |
|------|----------|
| Loader | `src/lib/appointments/patientNotifications.ts` → `loadPatientNotifications()` |
| Hook | `src/hooks/usePatientNotifications.ts` |
| UI | `PatientNotificationBell.tsx`, `PatientNotificationsPage.tsx`, patient home banner |
| Route | `/dashboard/patient/notifications` |

**Workaround today**

- If `GET .../notifications` is empty or fails, frontend **synthesizes** alerts from `GET .../me` + per-appointment detail (`loadPatientMedicalArchive()`).
- **Read/unread** is stored in **`localStorage`** (`medihub_patient_notifications_read`) — not synced across devices.

**Backend behavior**

- Return patient notifications only when `user.role === patient`.
- Doctors continue to receive booking/cancel alerts on the same route (or split to `.../notifications/doctor` if preferred).
- Emit notifications when: book, cancel, approve prescription, upload/delete doctor file.

---

## 5. Mark patient notifications read (persisted)

| Field | Value |
|-------|--------|
| **Priority** | P1 |
| **Status** | Missing |
| **User story** | Unread badge clears on all devices after patient views notifications. |

| | |
|---|---|
| **Method** | `PATCH` or `POST` |
| **Path (suggested)** | `/api/appointments/notifications/:notificationId/read` |
| **Alt** | `POST /api/appointments/notifications/mark-read` with `{ "ids": ["..."] }` |
| **Auth** | Patient (owner of notification) |
| **Body** | `{}` or `{ "read": true }` |

**Frontend today:** `markPatientNotificationsRead()` in `src/lib/appointments/patientNotificationState.ts` (local only).

**Backend behavior:** Update `read: true`; support mark-all.

---

## 6. SMS — booking confirmation with video consult link

| Field | Value |
|-------|--------|
| **Priority** | P1 |
| **Status** | Missing (not implemented on frontend or README) |
| **User story** | After booking, patient receives SMS with visit time and link to join the **video consult**. |

**Recommended flow (server-side on book)**

| | |
|---|---|
| **Trigger** | `POST /api/appointments/book` succeeds |
| **Input** | Patient `phone` from user profile or appointment; `appointmentId`; slot time; doctor name |
| **SMS body (example)** | `MediHub: Visit with Dr. {name} on {date} {time}. Join: {APP_URL}/dashboard/patient/consult/{appointmentId}` |

**Optional dedicated endpoints**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/appointments/:appointmentId/send-confirmation-sms` | Resend / manual send from admin or doctor |
| `POST` | `/api/appointments/book` | Accept `sendSmsConfirmation: boolean` (default `true` if phone present) |

**Suggested request (resend)**

```json
{
  "phone": "+919876543210",
  "includeConsultLink": true
}
```

**Backend requirements**

- Twilio / AWS SNS / similar; store `SMS_*` secrets server-side only.
- `APP_PUBLIC_URL` env for link host (e.g. `https://app.medihub.com`).
- Link requires auth — consider short-lived **magic link** token in SMS if product wants one-tap join:  
  `GET /api/auth/magic-link?token=...` → session → redirect to consult URL.
- Rate limit per phone; log delivery status.

**Frontend (planned, not wired yet)**

- Optional “Resend confirmation SMS” on `PatientAppointmentDetailPage`.
- Env: `VITE_APP_PUBLIC_URL` for display copy only; sending stays on server.

---

## 7. Notify patient on cancel / prescription / files (server-driven)

| Field | Value |
|-------|--------|
| **Priority** | P1 |
| **Status** | Partial — cancel UI says “patient will be notified”; implementation server-dependent |
| **User story** | Patient gets in-app notification (and optional SMS/email) when doctor cancels, approves Rx, or shares files. |

| Event | Suggested `kind` | Optional SMS |
|-------|------------------|--------------|
| `PATCH .../cancel-by-doctor` | `cancellation` | Yes |
| `PATCH .../prescription/approve` | `prescription` | Optional |
| `POST .../doctor-files` | `doctor_files` | Optional |
| `DELETE .../doctor-files` | — | No (or “file removed” in-app only) |
| `PATCH .../restore-by-doctor` | `appointment` | Optional |

No new REST route required if `GET/PATCH .../notifications` and book/cancel handlers create rows.

---

## 8. Emergency booking flag

| Field | Value |
|-------|--------|
| **Priority** | P1 |
| **Status** | Partial |
| **User story** | Emergency page books nearest available slot with priority flag. |

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/appointments/book` |
| **New field** | `isEmergency: boolean` (optional) |

**Frontend:** `BookAppointmentPanel.tsx`, `EmergencyAppointmentPage.tsx`.

**Backend:** Persist flag; optional queue prioritization + SMS (§6).

---

## 9. AI prescription draft must use live transcript

| Field | Value |
|-------|--------|
| **Priority** | P1 |
| **Status** | Partial |
| **User story** | AI draft includes consult conversation, not only static notes. |

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/appointments/:appointmentId/ai-draft` |
| **Requirement** | Load `meetingTranscript`, `doctorNotes`, symptoms, reports metadata from DB |

**Frontend:** `useConsultationTranscription.ts`, `DoctorConsultClinicalPanel.tsx` → `PATCH .../doctor-notes` then `POST .../ai-draft`.

---

## 10. AI Chat vision attachments (consult imaging)

| Field | Value |
|-------|--------|
| **Priority** | P1 |
| **Status** | Partial |
| **User story** | Doctor runs AI on MRI/X-ray during consult. |

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/ai/chats/messages` or `/api/ai/chats/:chatId/messages` |
| **Content-Type** | `multipart/form-data` |
| **Fields** | `message`, `attachments` (PNG, JPEG, WebP) |

**Frontend:** `src/lib/consult/imagingAi.ts`, `MedicalScanViewer.tsx`.

**Workaround:** No dedicated `POST .../analyze-imaging` (see P2).

---

# P2 — Recommended (performance & clinical pipelines)

## 11. Patient medical archive (aggregate)

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/appointments/me/archive` (suggested) |
| **Auth** | Patient |
| **Response** | List of visits with `prescription`, `patientReports[]`, `doctorFiles[]` embedded |

**Why:** `loadPatientMedicalArchive()` does `GET .../me` then N× `GET .../:id` — slow for long histories.

**Frontend:** `src/lib/appointments/medicalArchive.ts`, `/dashboard/patient/medical-records`, `/dashboard/patient/documents`.

---

## 12. Dedicated imaging analysis

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/appointments/:appointmentId/analyze-imaging` |
| **Body** | `reportId` or multipart image; optional clinical context |
| **Auth** | Doctor on appointment |

**Workaround:** AI Chat vision (§10).

---

## 13. Server vitals extraction (PDF OCR)

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/appointments/:appointmentId/extract-vitals` |
| **Response** | Structured vitals (BP, glucose, lipids, etc.) |

**Workaround:** Browser pdf.js + regex in `src/lib/appointments/vitals.ts`.

---

## 14. Server-side consultation transcription

| | |
|---|---|
| **Method** | `POST` or WebSocket |
| **Path** | `/api/appointments/:appointmentId/transcribe` |

**Workaround:** Web Speech API in browser; save via `PATCH .../doctor-notes` (`meetingTranscript`).

---

## 15. Hospital locator — map config & photos

| Field | Value |
|-------|--------|
| **Priority** | P2 |
| **Status** | Partial — **`GET .../nearby` wired**; map-config and photo proxy may be missing |
| **User story** | Patient finds hospitals on map without exposing API keys in the browser. |

| Method | Path | Frontend status |
|--------|------|-----------------|
| `GET` | `/api/hospital-locator/nearby` | **Used** — `fetchNearbyHospitals()` |
| `GET` | `/api/hospital-locator/map-config` | Optional — tile/key config from server |
| `GET` | `/api/hospital-locator/photo` | Optional — proxied place photos |
| `GET` | `/api/hospital-locator/hospitals` | Admin/local list |
| `POST` | `/api/hospital-locator/hospitals` | Admin CRUD |

**Frontend:** `HospitalLocatorPage.tsx`, `HospitalLocatorExperience.tsx`, `useHospitalLocatorSearch.ts`.

---

# Existing APIs — no new route required

| Feature | APIs | Notes |
|---------|------|--------|
| Upload patient reports | `POST .../reports` | Patient role |
| Upload doctor files | `POST .../doctor-files` | Doctor role; returns updated appointment |
| Approve prescription | `PATCH .../prescription/approve` | Patient sees via poll + notifications |
| Doctor notes / vitals | `PATCH .../doctor-notes` | Vitals often embedded in `doctorNotes` text |
| Cancel by doctor | `PATCH .../cancel-by-doctor` | Should trigger patient notification |
| Live consult sync | `GET .../:id` poll ~8s | `useConsultAppointmentPoll.ts` |
| Video / WebRTC | Socket.IO | See README WebRTC section |
| Doctor notifications | `GET .../notifications` | Fallback: synthesize from `GET .../me` |
| Auth refresh | `POST /api/auth/refresh` | `AuthTokenRefresh.tsx` |

---

# Implementation checklist (backend)

Recommended order for maximum frontend impact:

### Phase A — Unblock current UI (P0)

- [ ] **`DELETE .../doctor-files/:fileId`** (+ body fallback on collection URL)
- [ ] **`doctorFiles[]` on `GET .../:id` for patients** with `_id`, `url`, `title`
- [ ] **`PATCH .../restore-by-doctor`**

### Phase B — Patient engagement (P1)

- [ ] **Role-scoped `GET .../notifications`** with `kind` + `appointmentId`
- [ ] **Auto-create notifications** on book, cancel, approve Rx, upload file
- [ ] **`PATCH .../notifications/:id/read`** (replace localStorage read state)
- [ ] **SMS on book** (+ optional magic link) and optional resend endpoint
- [ ] **`isEmergency` on book**; **ai-draft uses `meetingTranscript`**; **AI Chat vision**

### Phase C — Scale & clinical (P2)

- [ ] **`GET .../me/archive`**
- [ ] Optional: analyze-imaging, extract-vitals, transcribe
- [ ] Hospital locator map-config + photo proxy

---

# Environment overrides (frontend)

| Variable | Related API / behavior |
|----------|-------------------------|
| `VITE_MEDIHUB_SERVER` | API origin (required) |
| `VITE_MEDIHUB_SAME_ORIGIN` | Proxy `/api` in dev |
| `VITE_APPOINTMENT_BY_ID_PATH` | Appointment detail |
| `VITE_APPOINTMENT_RESTORE_BY_DOCTOR_PATH` | Restore cancelled visit |
| `VITE_APPOINTMENT_DOCTOR_FILE_DELETE_PATH` | Delete doctor file template |
| `VITE_APPOINTMENTS_NOTIFICATIONS_PATH` | Doctor + patient notifications |
| `VITE_APPOINTMENTS_ME_PATH` | Patient appointment list |
| `VITE_HOSPITAL_LOCATOR_NEARBY_PATH` | Hospital search |
| `VITE_APP_PUBLIC_URL` | (Suggested) SMS / consult links in copy |

Full list: `src/lib/config.ts`, `.env.example`.

---

# Source references (frontend)

| Area | Files |
|------|--------|
| Appointments API | `src/lib/api/appointments.ts` |
| Paths / env | `src/lib/config.ts` |
| Normalize appointment + files | `src/lib/appointments/normalize.ts` |
| Patient notifications | `src/lib/appointments/patientNotifications.ts`, `patientNotificationState.ts` |
| Doctor notifications | `src/lib/appointments/notifications.ts` |
| Doctor file upload/delete UI | `DoctorFilesUploadSection.tsx`, `DoctorAppointmentFileList.tsx` |
| Patient doctor files UI | `PatientDoctorFilesSection.tsx`, `PatientVisitDocumentsPage.tsx` |
| Medical archive | `src/lib/appointments/medicalArchive.ts` |
| Consult / transcript / imaging | `useConsultationTranscription.ts`, `DoctorConsultClinicalPanel.tsx`, `imagingAi.ts` |
| Booking / emergency | `BookAppointmentPanel.tsx`, `EmergencyAppointmentPage.tsx` |
| Restore cancel | `DoctorCancelledAppointmentsSection.tsx` |
| Routes | `src/app/App.tsx` |

---

# README gaps to add

When updating [README.md](../../README.md), add sections for:

1. `DELETE /api/appointments/:appointmentId/doctor-files/:fileId`
2. Patient-visible `doctorFiles` on `GET` appointment
3. Patient notification types on `GET /api/appointments/notifications`
4. `PATCH` mark notification read
5. SMS confirmation on book (and env vars)
6. `PATCH .../restore-by-doctor`
