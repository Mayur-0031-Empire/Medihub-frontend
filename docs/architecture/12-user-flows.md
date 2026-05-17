# 12. Key user flows

End-to-end sequences for the main product journeys.

## 12.1 Patient registration and first login

```mermaid
flowchart TD
  A[/register] --> B[Pick role patient]
  B --> C[Fill multipart form + photo]
  C --> D[POST /api/auth/register]
  D --> E{Token in response?}
  E -->|yes| F[sessionStorage Bearer]
  E -->|no| G[Cookies only]
  F --> H[GET /api/users/me]
  G --> H
  H --> I[/dashboard/patient]
```

## 12.2 Doctor registration (account + profile)

```mermaid
flowchart TD
  A[/register/doctor] --> B[Account fields + professional fields]
  B --> C[POST /api/auth/register role doctor]
  C --> D[POST /api/doctors/me multipart]
  D --> E{Profile OK?}
  E -->|yes| F[/dashboard/doctor]
  E -->|no| G[Account exists — finish at /dashboard/doctor-profile]
```

## 12.3 Book appointment (patient)

1. Patient navigates to appointments or home doctor list.
2. `fetchPublicDoctors()` — optional `title` filter.
3. Select doctor → `fetchDoctorSlots(doctorProfileId, from, to)`.
4. `BookAppointmentPanel` — pick slot, enter symptoms/notes.
5. `bookAppointment({ slotId, symptoms, patientNotes, isEmergency? })`.
6. Redirect to appointment detail or list.

**Emergency variant:** `/emergency` may set `isEmergency: true` (confirm backend support — see API gaps doc).

## 12.4 Doctor creates availability

1. `/dashboard/doctor/slots`.
2. Build slot array `{ startAt, endAt }[]` in local timezone → ISO UTC.
3. `createAppointmentSlots({ slots })`.
4. Refetch slots or show success toast.

**Admin variant:** `/dashboard/admin/manage-slots` — `createAppointmentSlotsForDoctor` with target doctor profile id.

## 12.5 Admin verifies doctor

1. `/dashboard/admin/pending-doctors`.
2. `fetchAdminPendingDoctors()`.
3. Review documents on `PendingDoctorCard`.
4. `verifyAdminDoctor(id, { verificationStatus, documentIds, rejectionReason, isRecommended })`.
5. List refresh.

## 12.6 Live video consultation

### Preconditions

- Appointment exists and user is participant (patient or assigned doctor).
- Both have granted camera/microphone.
- Valid auth for Socket.IO.

### Steps

1. Navigate to `/dashboard/{role}/consult/:appointmentId`.
2. Load `fetchAppointmentById`.
3. `useVideoConsultation.start()`:
   - `createConsultationSocket()`
   - `joinConsultationRoom`
   - `getUserMedia` + create `RTCPeerConnection`
   - Exchange offer/answer/ICE via socket
4. **Doctor only:** start transcription; clinical panel PATCH notes.
5. **Patient:** upload reports via `ConsultMedicalUpload`.
6. **Poll:** appointment detail every 8s while connected (doctor) or on page (patient).
7. `hangUp()` → leave room, stop tracks, close PC.

### Post-consult (doctor)

1. `generateAppointmentAiDraft(appointmentId)` — uses transcript if saved.
2. Edit draft → `approveAppointmentPrescription({ approvedText })`.
3. Patient sees prescription via poll on consult page.

## 12.7 AI health chatbot (patient/admin)

1. `/dashboard/chatbot`.
2. `listAiChats()` or create new.
3. Send message: `sendAiChatMessage` or with attachments.
4. Render markdown replies via `react-markdown`.
5. Optional sentiment hint via `chatSentiment.ts`.

## 12.8 BMI Buddy

1. `/dashboard/bmi-buddy` — collect height/weight.
2. `calculateBmi({ heightCm, weightKg })`.
3. Navigate to `/dashboard/bmi-buddy/results` with state or refetch.
4. Display category + plans; fallback to `lib/bmi/local.ts` on error.

## 12.9 Hospital locator

1. `/dashboard/hospital-locator` or home panel.
2. Request browser geolocation (or manual lat/lng).
3. `fetchNearbyHospitals({ latitude, longitude, rangeKm, specialty? })`.
4. Normalize → map markers + cards + analytics charts.

## 12.10 Medical library (patient)

1. `/dashboard/patient/medical-records`.
2. `fetchMyAppointments()`.
3. For each visit (or filtered subset): `fetchAppointmentById` — **N+1 pattern**.
4. `buildMedicalArchive()` groups prescriptions and files by appointment.

**Optimization opportunity:** backend archive endpoint (documented as gap).

## 12.11 Restore cancelled appointment (doctor)

1. Open cancelled visit in list or detail.
2. `restoreAppointmentByDoctor(appointmentId)`.
3. On 404/405/501: fallback PATCH doctor-notes `{ status: "scheduled" }`.
4. Refresh list.

## 12.12 OAuth login

1. Click social button → redirect to `buildOAuthStartUrl(provider)`.
2. Provider → backend → redirect to `VITE_OAUTH_REDIRECT_URL` (`/auth/callback`).
3. `extractAccessTokenFromUrl` → `setAccessToken`.
4. `fetchCurrentUser` → dashboard home by role.
