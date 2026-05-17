# 4. Directory structure

Complete map of `src/` (~170 TypeScript files). Paths use the `@/` alias (`src/`).

## 4.1 Root application files

| Path | Purpose |
|------|---------|
| `main.tsx` | `createRoot`, `StrictMode`, mounts `App` |
| `app/App.tsx` | `BrowserRouter`, route tree, `AuthTokenRefresh` |
| `index.css` | Tailwind + global CSS variables |
| `vite-env.d.ts` | `ImportMetaEnv` typings for `VITE_*` |

## 4.2 `src/pages/`

### Public (`pages/public/`)

| File | Route | Role |
|------|-------|------|
| `HomePage.tsx` | `/`, `/home` | Care network charts (`HomeNetworkDashboard`) + feature card grid |
| `SplashPage.tsx` | `/splash` | Intro loader → redirects to `/` |
| `AboutPage.tsx` | `/about` | About MediHub (navbar link) |
| `PortalsPage.tsx` | `/portals` | Role registration cards |
| `features/AiAssistantFeaturePage.tsx` | `/features/ai-assistant` | Guest AI chat |
| `features/BmiBuddyFeaturePage.tsx` | `/features/bmi-buddy` | BMI tool |
| `features/HospitalLocatorFeaturePage.tsx` | `/features/hospital-locator` | Hospital map + network |
| `EmergencyAppointmentPage.tsx` | `/emergency` | Emergency booking (`isEmergency` flag) |

### Auth (`pages/auth/`)

| File | Route | Role |
|------|-------|------|
| `LoginPage.tsx` | `/login` | JSON login, `returnTo`, portal query |
| `RegisterEntryPage.tsx` | `/register` | Role picker → `/register/:role` |
| `RegisterPage.tsx` | `/register/:role` | Patient/admin multipart register |
| `DoctorRegisterPage.tsx` | Used from register flow | Doctor account + `POST /api/doctors/me` |
| `AuthCallbackPage.tsx` | `/auth/callback` | OAuth token extraction from URL |

Legacy re-exports: `pages/LoginPage.tsx`, `pages/RegisterPage.tsx`, etc. point to `auth/*`.

### Dashboard shell

| File | Purpose |
|------|---------|
| `dashboard/context/outletContext.ts` | `DashboardOutletContext` type |
| `dashboard/outletContext.ts` | Re-export shim |

### Patient (`pages/dashboard/patient/`)

| File | Route |
|------|-------|
| `DashboardPatientHomeRoute.tsx` | `/dashboard/patient` |
| `PatientDashboardHome.tsx` | Home UI + charts |
| `PatientProfileRoute.tsx` | `/dashboard/patient/profile` |
| `PatientAppointmentsPage.tsx` | `/dashboard/patient/appointments` |
| `PatientAppointmentDetailRoute.tsx` | `/dashboard/patient/appointments/:id` |
| `PatientConsultRoute.tsx` | `/dashboard/patient/consult/:appointmentId` |
| `PatientMedicalRecordsRoute.tsx` | `/dashboard/patient/medical-records` |

### Doctor (`pages/dashboard/doctor/`)

| File | Route |
|------|-------|
| `DoctorHomeRoute.tsx` | `/dashboard/doctor` |
| `DoctorAppointmentsRoute.tsx` | `/dashboard/doctor/appointments` |
| `DoctorAppointmentDetailRoute.tsx` | `/dashboard/doctor/appointments/:id` |
| `DoctorConsultRoute.tsx` | `/dashboard/doctor/consult/:appointmentId` |
| `DoctorManageSlotsRoute.tsx` | `/dashboard/doctor/slots` |
| `DoctorNotificationsRoute.tsx` | `/dashboard/doctor/notifications` |
| `DoctorProfilePage.tsx` | `/dashboard/doctor-profile` |

### Admin (`pages/dashboard/admin/`)

| File | Route |
|------|-------|
| `DashboardAdminHomeRoute.tsx` | `/dashboard/admin` |
| `AdminPendingDoctorsRoute.tsx` | `/dashboard/admin/pending-doctors` |
| `AdminAppointmentsRoute.tsx` | `/dashboard/admin/appointments` |
| `AdminManageSlotsRoute.tsx` | `/dashboard/admin/manage-slots` |
| `AdminProfileRoute.tsx` | `/dashboard/admin/profile` |

### Shared dashboard (`pages/dashboard/shared/`)

| File | Route | Gate |
|------|-------|------|
| `AiChatPage.tsx` | `/dashboard/chatbot` | patient, admin |
| `BmiBuddySetupPage.tsx` | `/dashboard/bmi-buddy` | patient, admin |
| `BmiBuddyResultsPage.tsx` | `/dashboard/bmi-buddy/results` | patient, admin |
| `HospitalLocatorPage.tsx` | `/dashboard/hospital-locator` | patient, admin |
| `DashboardFeaturePlaceholderPage.tsx` | `/dashboard/patient-services` | patient |

## 4.3 `src/components/`

Organized by **feature**, not atomic design tier.

| Folder | Key components |
|--------|----------------|
| `layout/` | `RootLayout`, `DashboardLayout`, `DashboardRoleGate` |
| `auth/` | `AuthTokenRefresh`, `SocialAuthButtons`, `RegisterAccountSections`, `PortalRolePicker` |
| `brand/` | `Logo`, `LoginHeroDoctor` |
| `appointments/` | `BookAppointmentPanel`, `DoctorCard`, `AppointmentHistoryList`, `DoctorFiltersPanel` |
| `doctor/` | `DoctorConsultClinicalPanel`, `MedicalScanViewer`, `DocumentVitalsIntake`, `DoctorCancelledAppointmentsSection` |
| `consult/` | `VideoConsultRoom`, `ConsultMedicalUpload`, `PatientConsultPrescriptionCard` |
| `admin/` | `PendingDoctorCard`, `AdminAppointmentList` |
| `hospital-locator/` | `HospitalLocatorExperience`, `HospitalLocatorMap`, `HospitalAnalyticsDashboard` |
| `public/` | `GuestAiChatPanel`, `HomeBmiBuddyPanel`, `HomeHospitalLocatorPanel` |
| `charts/` | `AnalyticsPieChart`, `AnalyticsBarChart`, `ChartPanel` |
| `dashboard/` | `DoctorDashboardCharts`, `AdminDashboardCharts` |

## 4.4 `src/hooks/`

| Hook | File | Purpose |
|------|------|---------|
| `useVideoConsultation` | `useVideoConsultation.ts` | Socket + WebRTC full lifecycle |
| `useConsultAppointmentPoll` | `useConsultAppointmentPoll.ts` | 8s polling of appointment detail |
| `useConsultationTranscription` | `useConsultationTranscription.ts` | Web Speech → `meetingTranscript` |
| `useDoctorNotifications` | `useDoctorNotifications.ts` | Notification poll + unread count |

## 4.5 `src/lib/api/`

| Module | Exports (summary) |
|--------|-------------------|
| `client.ts` | `medihubFetch`, `parseJsonSafe`, `unwrapData`, `formatApiFailure` |
| `server.ts` | `isServerConfigured`, `buildOAuthStartUrl` |
| `auth.ts` | `registerAccount`, `loginWithPassword`, `logout`, `refreshAuthToken` |
| `users.ts` | `fetchCurrentUser`, profile/photo/password PATCH |
| `doctors.ts` | `fetchDoctorMe`, `createDoctorProfile`, public list |
| `admin.ts` | Pending doctors, verify |
| `appointments.ts` | Slots, book, detail, notes, files, AI draft, cancel, restore |
| `ai-chat.ts` | Chat CRUD, messages, attachments |
| `bmi.ts` | Info + calculate |
| `hospital-locator.ts` | Nearby hospitals |
| `index.ts` | Barrel re-export for `@/lib/api` |

## 4.6 `src/lib/` (non-API domain)

| Path | Purpose |
|------|---------|
| `config.ts` | All path builders + server URL helpers |
| `dashboardPaths.ts` | Role home paths, safe `returnTo` |
| `userMessages.ts` | User-facing error strings |
| `mediaUrl.ts` | Resolve relative media URLs against API host |
| `slotSchedule.ts` | Slot time helpers |
| `auth/` | Session, register validation, portal role, copy |
| `appointments/` | Normalize, filters, vitals PDF, medical archive, slots |
| `doctors/` | Profile validation, admin normalize, doctor form builders |
| `ai/` | Reply normalization, sentiment, care messages |
| `bmi/` | Local fallback remedies when API offline |
| `consult/` | `imagingAi.ts`, `transcript.ts` |
| `hospital-locator/normalize.ts` | API → map markers |
| `analytics/` | Chart data from appointments/hospitals |
| `socket/consultation.ts` | Socket.IO factory + join/leave |
| `webrtc/iceServers.ts` | Parse `VITE_WEBRTC_ICE_SERVERS` |

## 4.7 `src/types/`

| File | Domain |
|------|--------|
| `auth.ts` | `User`, `ApiEnvelope`, roles |
| `appointment.ts` | Slots, list items, detail, notifications |
| `doctor.ts` | Doctor profile, documents |
| `admin.ts` | Pending doctor verification |
| `aiChat.ts` | Chat threads, messages |
| `bmi.ts` | BMI categories, plans |
| `hospital.ts` | Nearby hospital DTOs |
| `consultation.ts` | Socket/WebRTC payload types |
| `vitals.ts` | Extracted lab vitals structure |

## 4.8 Non-source project files

| Path | Purpose |
|------|---------|
| `docs/` | Setup, production, API gaps, **this architecture set** |
| `dist/` | Production build output (gitignored in normal workflow) |
| `.env.example` | Template env vars |
| `IMPLEMENTED_FEATURES_API_GAPS.md` | UI vs README contract |
