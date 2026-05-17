# 8. Domain modules

Pure and semi-pure logic outside `lib/api/` — normalization, validation, client-side processing, and UX helpers.

## 8.1 Appointments (`lib/appointments/`)

| Module | Responsibility |
|--------|----------------|
| `normalize.ts` | API JSON → `PatientAppointment`, `AppointmentDetail` |
| `filters.ts` | List filtering by status, date, search |
| `status.ts` | Status labels and color mapping |
| `slots.ts` | Slot grouping, availability display |
| `symptoms.ts` | Symptom text helpers |
| `notifications.ts` | Merge API notifications with synthesized from appointments |
| `emergency.ts` | Emergency booking copy and payload flags |
| `medicalArchive.ts` | Build medical library from list + detail fetches (N+1) |
| `medicalFileKind.ts` | Classify upload as image/PDF/other |
| `fetchReportAsFile.ts` | Download report URL as `File` for parsing |
| `documentText.ts` | Extract text from uploaded documents |
| `vitals.ts` | **Client-side** PDF/text vitals extraction (pdf.js + regex) |
| `local.ts` | Demo/local fallback data when API unavailable |

**Vitals pipeline (doctor consult):**

1. Patient uploads report → stored on server, URL on appointment.
2. Doctor clicks "Extract vitals" → `fetchReportAsFile` → `extractVitalsFromDocument`.
3. Results shown in `DocumentVitalsIntake`; may embed in `doctorNotes` PATCH.

No server OCR endpoint.

## 8.2 Doctors (`lib/doctors/`)

| Module | Responsibility |
|--------|----------------|
| `profileValidation.ts` | Doctor profile form rules |
| `doctorMeForm.ts` | Build `FormData` for create/update profile |
| `adminNormalize.ts` | Pending doctor card data shape |
| `index.ts` | Barrel exports |

## 8.3 Auth (`lib/auth/`)

| Module | Responsibility |
|--------|----------------|
| `session.ts` | Token storage (see chapter 6) |
| `registerValidation.ts` | Shared register form schema |
| `registerRoleCopy.ts` | Role-specific UI strings |
| `portalRole.ts` | Role normalization, register paths |

## 8.4 AI (`lib/ai/`)

| Module | Responsibility |
|--------|----------------|
| `normalize.ts` | Chat/message shape from varied API responses |
| `reply.ts` | Extract assistant text from message objects |
| `chatSentiment.ts` | `sentiment` package scoring for UX hints |
| `careMessage.ts` | Safety/disclaimer copy for health chat |

**Consult imaging** (`lib/consult/imagingAi.ts`):

- Builds radiology prompt with appointment context.
- Calls `sendAiChatMessageWithAttachments` — **not** a dedicated imaging endpoint.
- Requires vision-capable backend model.

## 8.5 BMI (`lib/bmi/`)

| Module | Responsibility |
|--------|----------------|
| `index.ts` | Re-exports |
| `local.ts` | Offline category/plan fallback |
| `remedies.ts` | Static remedy suggestions when API fails |

Dashboard flow: setup page collects height/weight → `calculateBmi` API → results page shows plans.

Home page embeds `HomeBmiBuddyPanel` for guests (public API).

## 8.6 Hospital locator (`lib/hospital-locator/`)

| Module | Responsibility |
|--------|----------------|
| `normalize.ts` | API hospitals → map markers + card props |

**UI stack:**

- `HospitalLocatorExperience` — geolocation, search, list + map split.
- `HospitalLocatorMap` — react-leaflet map.
- `HospitalAnalyticsDashboard` — distance/specialty charts via `lib/analytics/hospitalAnalytics.ts`.

Map tiles use OpenStreetMap (no Google key in frontend). Hospital photos use backend proxy URLs from API.

## 8.7 Consult helpers (`lib/consult/`)

| Module | Responsibility |
|--------|----------------|
| `transcript.ts` | Format timestamped transcript lines |
| `imagingAi.ts` | AI scan analysis orchestration |

## 8.8 Analytics (`lib/analytics/`)

| Module | Responsibility |
|--------|----------------|
| `appointmentAnalytics.ts` | Pie/bar data: status, time slots, illness labels |
| `hospitalAnalytics.ts` | Distance buckets, specialty counts |

Used by `DoctorDashboardCharts`, `AdminDashboardCharts`, hospital analytics panel. **No external analytics SDK** (GA, etc.) in dependencies.

## 8.9 Cross-cutting utilities

| Module | Responsibility |
|--------|----------------|
| `dashboardPaths.ts` | Role-based home + safe redirects |
| `mediaUrl.ts` | Prefix relative URLs with API origin |
| `slotSchedule.ts` | Calendar slot math |
| `userMessages.ts` | Centralized user-facing strings |

## 8.9 Feature ↔ domain map

| Product feature | API module | Domain module | Primary UI |
|-----------------|------------|---------------|------------|
| Book visit | `appointments.ts` | `slots`, `filters` | `BookAppointmentPanel` |
| Doctor slots | `appointments.ts` | `slots` | `DoctorManageSlotsPage` |
| Live consult | `appointments.ts` + socket | `vitals`, `imagingAi`, `transcript` | `DoctorConsultPage`, `VideoConsultRoom` |
| Medical library | `appointments.ts` | `medicalArchive` | `PatientMedicalRecordsPage` |
| AI chatbot | `ai-chat.ts` | `normalize`, `reply` | `AiChatPage` |
| Verify doctors | `admin.ts` | `adminNormalize` | `AdminPendingDoctorsPage` |
| Restore cancelled | `appointments.ts` | `status` | `DoctorCancelledAppointmentsSection` |
