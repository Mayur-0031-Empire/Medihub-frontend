# 7. HTTP API layer

All REST integration lives under `src/lib/api/`. Application code should import from `@/lib/api` rather than calling `fetch` directly.

## 7.1 Core client (`client.ts`)

### `medihubFetch(input, init?)`

- Wraps native `fetch`.
- Injects `Authorization: Bearer` when token exists.
- Catches network errors → throws `NETWORK_ERROR` message.

### `parseJsonSafe(res)`

- Reads body as text; empty → `null`.
- Invalid JSON → `{ raw: text }` (for debugging failed HTML error pages).

### `unwrapData<T>(body)`

Handles MediHub **envelope** format:

```json
{ "success": true, "data": { ... }, "message": "..." }
```

Returns `{ ok: true, data }` or `{ ok: false, message }`.

### `formatApiFailure(body, fallback)`

Extracts `message` or joins `errors[]` for thrown `Error` messages.

## 7.2 URL construction

Pattern used in every API module:

```ts
const base = assertMedihubServerConfigured(); // "" or full origin
const res = await medihubFetch(`${base}${appointmentsMePath()}`, {
  method: "GET",
  credentials: "include",
});
```

Path functions live in `src/lib/config.ts` — each reads optional `import.meta.env.VITE_*_PATH` override.

## 7.3 API module reference

### `auth.ts`

| Function | Method | Default path |
|----------|--------|--------------|
| `registerAccount` | POST multipart | `/api/auth/register` |
| `loginWithPassword` | POST JSON | `/api/auth/login` |
| `logout` | POST | `/api/auth/logout` |
| `refreshAuthToken` | POST | `/api/auth/refresh` |

### `users.ts`

| Function | Method | Path |
|----------|--------|------|
| `fetchCurrentUser` | GET | `/api/users/me` |
| `patchCurrentUserProfile` | PATCH JSON | `/api/users/me` |
| `patchCurrentUserPhoto` | PATCH multipart | `/api/users/me/photo` |
| `patchCurrentUserPassword` | PATCH JSON | `/api/users/me/password` |

`normalizeUser(unknown)` coerces API user object → `User`.

### `doctors.ts`

| Function | Method | Path |
|----------|--------|------|
| `fetchDoctorMe` | GET | `/api/doctors/me` |
| `createDoctorProfile` | POST multipart | `/api/doctors/me` |
| `updateDoctorProfile` | PATCH JSON | `/api/doctors/me` |
| `addDoctorDocuments` | POST multipart | `/api/doctors/me/documents` |
| `fetchPublicDoctors` | GET | `/api/doctors` |

### `admin.ts`

| Function | Method | Path |
|----------|--------|------|
| `fetchAdminPendingDoctors` | GET | `/api/doctors/admin/pending` |
| `verifyAdminDoctor` | PATCH JSON | `/api/doctors/admin/:id/verify` |

### `appointments.ts`

| Function | Method | Notes |
|----------|--------|-------|
| `createAppointmentSlots` | POST JSON | Doctor slots |
| `createAppointmentSlotsForDoctor` | POST | Admin path variants |
| `fetchDoctorSlots` | GET | Public slots by doctor profile id |
| `fetchMyAppointments` | GET | Role-filtered list |
| `bookAppointment` | POST JSON | May include `isEmergency` |
| `fetchAppointmentById` | GET | Detail for consult |
| `uploadPatientAppointmentReports` | POST multipart | `reports` files |
| `updatePatientAppointmentSymptoms` | PATCH | symptoms, notes |
| `updateDoctorAppointmentNotes` | PATCH | diagnosis, transcript, status |
| `uploadDoctorAppointmentFiles` | POST multipart | |
| `generateAppointmentAiDraft` | POST | AI prescription draft |
| `approveAppointmentPrescription` | PATCH | `approvedText` |
| `cancelAppointmentByDoctor` | PATCH | optional `reason` |
| `restoreAppointmentByDoctor` | PATCH | See API gaps doc; fallback to doctor-notes status |
| `fetchAppointmentNotifications` | GET | Doctor bell |

### `ai-chat.ts`

| Function | Method | Path |
|----------|--------|------|
| `listAiChats` | GET | `/api/ai/chats` |
| `createAiChat` | POST | `/api/ai/chats` |
| `getAiChat` | GET | `/api/ai/chats/:id` |
| `sendAiChatMessage` | POST JSON | aggregate or per-chat messages |
| `sendAiChatMessageWithAttachments` | POST multipart | vision / files |
| `renameAiChat` | PATCH | |
| `deleteAiChat` | DELETE | |

### `bmi.ts`

| Function | Method |
|----------|--------|
| `fetchBmiBuddyInfo` | GET `/api/bmi-buddy` |
| `calculateBmi` | POST `/api/bmi-buddy/calculate` |

### `hospital-locator.ts`

| Function | Method |
|----------|--------|
| `fetchNearbyHospitals` | GET `/api/hospital-locator/nearby` |

Query: `latitude`, `longitude`, `rangeKm`, optional `specialty`, `maxResultCount`.

## 7.4 Multipart conventions

- **Do not** set `Content-Type` header on `FormData` bodies.
- File fields: `photo`, `reports`, `documents`, `attachments`, `files` per README.
- Doctor documents: `documentTitles` as JSON string array + repeated `documents` keys.

## 7.5 Response handling pattern

Typical function structure:

```ts
export async function fetchMyAppointments(): Promise<PatientAppointment[]> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${appointmentsMePath()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(formatApiFailure(body, "Could not load appointments."));
  const unwrapped = unwrapData<unknown>(body);
  if (!unwrapped.ok) throw new Error(unwrapped.message);
  return normalizeAppointmentList(unwrapped.data);
}
```

Normalization functions live in `lib/appointments/normalize.ts`, `lib/doctors/adminNormalize.ts`, etc.

## 7.6 `server.ts` utilities

- `isServerConfigured()` — boolean for UI empty states.
- `buildOAuthStartUrl("google" | "apple" | "microsoft")` — full redirect URL to backend OAuth start.

## 7.7 Config path override matrix

Every `*Path()` in `config.ts` has a matching optional `VITE_*` env documented in `.env.example`. Use when deployed API paths differ from README defaults without code changes.

Examples:

- `VITE_APPOINTMENT_RESTORE_BY_DOCTOR_PATH`
- `VITE_APPOINTMENTS_ADMIN_SLOTS_PATH`
- `VITE_AI_CHATS_PATH`

## 7.8 Module-to-README index

| `lib/api` file | README section |
|----------------|----------------|
| `auth.ts`, `users.ts` | Authentication, Protected User |
| `doctors.ts`, `admin.ts` | Doctor APIs |
| `appointments.ts` | Appointment APIs |
| `ai-chat.ts` | AI Chat APIs |
| `bmi.ts` | Public BMI Buddy |
| `hospital-locator.ts` | Hospital locator |

Socket/WebRTC is **not** in `lib/api/` — see [09-realtime-and-webrtc.md](./09-realtime-and-webrtc.md).
