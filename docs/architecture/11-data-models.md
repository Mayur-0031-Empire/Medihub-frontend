# 11. Data models and types

TypeScript interfaces in `src/types/` mirror MediHub API JSON. Runtime values are **not** validated with a schema library — normalization functions coerce `unknown` API data.

## 11.1 Auth (`types/auth.ts`)

```ts
type PortalRole = "patient" | "doctor" | "admin";
type UserRole = PortalRole;

interface User {
  _id: string;
  firstName?, lastName?, username?, role: UserRole;
  email?, phone?, photo?;
  gender?, address?, bloodGroup?, age?;
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorShape;
```

## 11.2 Appointments (`types/appointment.ts`)

| Type | Use |
|------|-----|
| `PublicDoctorProfile` | Doctor discovery cards |
| `AppointmentSlot` | Booking slot picker |
| `PatientAppointment` | List rows (patient/doctor/admin lists) |
| `AppointmentDetail` | Detail + consult (extends list type with clinical fields) |
| `AppointmentFileRef` | `{ title?, url?, name? }` for reports/files |
| `AppointmentNotification` | Doctor notification bell |
| `UpdateDoctorNotesPayload` | PATCH doctor-notes body |
| `BookAppointmentPayload` | Includes `slotId`, symptoms, `isEmergency?` |

Key detail fields on `AppointmentDetail`:

- `doctorDiagnosis`, `doctorNotes`, `meetingTranscript`
- `prescriptionDraft`, `approvedPrescription`, `prescriptionText`
- `patientReports[]`, `doctorFiles[]`
- `cancelReason`

## 11.3 Doctors (`types/doctor.ts`)

Doctor profile, qualification documents, verification status — used on profile pages and admin pending cards. See file for full field list aligned with `POST /api/doctors/me`.

## 11.4 Admin (`types/admin.ts`)

Pending doctor verification payloads for `verifyAdminDoctor`.

## 11.5 AI chat (`types/aiChat.ts`)

Chat thread, message roles (`user` | `assistant`), attachment metadata. Normalization in `lib/ai/normalize.ts` handles API variations (`content` vs `message` vs `reply`).

## 11.6 BMI (`types/bmi.ts`)

Categories, plan arrays (`dietPlan`, `workoutPlan`, `lifestylePlan`), calculate response shape.

## 11.7 Hospital (`types/hospital.ts`)

Nearby search result: `currentLocation`, `hospitals[]` with `placeId`, `distanceKm`, `latitude`, `longitude`, proxy photo URLs.

## 11.8 Consultation / WebRTC (`types/consultation.ts`)

```ts
type ConsultationConnectionStatus =
  | "idle" | "connecting" | "connected" | "disconnected" | "error";

interface ConsultationJoinAck {
  ok: boolean;
  roomName?: string;
  socketId?: string;
  message?: string;
}
```

WebRTC SDP payloads typed for Socket.IO emit/listen.

## 11.9 Vitals (`types/vitals.ts`)

Structured vitals extracted client-side (e.g. blood pressure, glucose) — not necessarily persisted as separate API entity; often embedded in `doctorNotes` text.

## 11.10 Normalization strategy

API responses may return:

- Arrays at root or under `data.appointments`, `data.items`, etc.
- Populated `doctor` object vs flat `doctorName` string.
- Mongo `_id` vs `id`.

Normalizers in `lib/appointments/normalize.ts`:

- Walk known keys.
- Produce stable UI types.
- Default missing strings to `""` or `"Unknown"`.

**Rule for new endpoints:** add interface in `types/`, add `normalizeX()` in domain lib, call from `lib/api/*.ts`.

## 11.11 ID and encoding

- Path IDs passed through `encodeURIComponent` in `config.ts` path builders.
- Appointment/doctor IDs treated as opaque strings (Mongo ObjectId strings).

## 11.12 Date handling

- API dates: ISO 8601 strings (`startAt`, `endAt`, `createdAt`).
- Display: `Date` parsing in components; analytics use **local** timezone for "today" filters (`appointmentAnalytics.isSameLocalDay`).
